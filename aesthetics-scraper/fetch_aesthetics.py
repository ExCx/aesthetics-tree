import json
import os
import re
import sys
import time
import mwparserfromhell
import requests
import networkx as nx

API_URL = "https://aesthetics.fandom.com/api.php"
HEADERS = {"User-Agent": "AestheticsChronologyTree/2.0 (Educational Project)"}

# Default straight into the Vite public/ folder, resolved from this file rather
# than the cwd, so a CI checkout only has to run `python
# aesthetics-scraper/fetch_aesthetics.py`. An explicit OUTPUT_DIR still wins
# (the Docker image sets /output).
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "").strip() or os.path.join(REPO_ROOT, "public")

# A sudden shrink means a Fandom outage or an API change, not a real wiki
# purge. Refuse to write over the live data below these guard rails:
#   MIN_NODES              absolute floor for a healthy scrape
#   MIN_RETENTION_RATIO    fraction of the already-committed dataset to keep
MIN_NODES = int(os.environ.get("MIN_NODES", "500"))
MIN_RETENTION_RATIO = float(os.environ.get("MIN_RETENTION_RATIO", "0.5"))

session = requests.Session()
session.headers.update(HEADERS)

def get_all_aesthetic_titles():
    print("[1/5] Fetching list of all aesthetic articles...")
    titles = []
    params = {
        "action": "query",
        "list": "embeddedin",
        "eititle": "Template:Aesthetic",
        "eilimit": 500,
        "format": "json",
    }
    while True:
        res = session.get(API_URL, params=params, timeout=30).json()
        for page in res.get("query", {}).get("embeddedin", []):
            if page.get("ns") == 0:
                titles.append(page["title"])
        if "continue" in res:
            params.update(res["continue"])
        else:
            break
    print(f"      Found {len(titles)} articles.")
    return sorted(set(titles))

def fetch_wikitext(titles, batch_size=50):
    print("[2/5] Downloading article content...")
    raw_pages = {}
    total_batches = (len(titles) + batch_size - 1) // batch_size
    for i in range(0, len(titles), batch_size):
        batch = titles[i : i + batch_size]
        print(f"      Batch {(i // batch_size) + 1}/{total_batches}...")
        params = {
            "action": "query",
            "prop": "revisions",
            "rvprop": "content",
            "rvslots": "main",
            "titles": "|".join(batch),
            "format": "json",
        }
        res = session.get(API_URL, params=params, timeout=30).json()
        for page_info in res.get("query", {}).get("pages", {}).values():
            if "revisions" in page_info:
                raw_pages[page_info["title"]] = page_info["revisions"][0]["slots"]["main"]["*"]
        time.sleep(0.5)
    return raw_pages

def extract_links_from_param(param_value):
    links = [str(link.title).strip() for link in param_value.filter_wikilinks()]
    if links: return links
    plain = param_value.strip_code().strip()
    return [item.strip() for item in re.split(r"[,•*\n]", plain) if item.strip()]

def parse_year(decade_str):
    if not decade_str: return None
    year_match = re.search(r"(1[6-9]\d{2}|20[0-2]\d)", decade_str)
    if year_match: return int(year_match.group(1))
    century_match = re.search(r"(\d{2})(?:st|nd|rd|th)\s+century", decade_str, re.IGNORECASE)
    if century_match: return (int(century_match.group(1)) - 1) * 100 + 50
    return None

def parse_infobox(wikitext):
    wikicode = mwparserfromhell.parse(wikitext)
    target_template = next((t for t in wikicode.filter_templates() if t.name.strip().lower() == "aesthetic"), None)
    if not target_template: return {}

    def get_text(field): return target_template.get(field).value.strip_code().strip() if target_template.has(field) else ""
    def get_links(field): return extract_links_from_param(target_template.get(field).value) if target_template.has(field) else []

    raw_image = get_text("image1")
    image_file = re.sub(r"^File:", "", raw_image.splitlines()[0].strip(), flags=re.IGNORECASE) if raw_image and "." in raw_image else ""

    origin_raw = get_text("decade_of_origin")
    return {
        "origin_raw": origin_raw,
        "year": parse_year(origin_raw),
        "motifs": get_text("key_motifs"),
        "colours": get_text("key_colours"),
        "platform": get_text("primary_platform"),
        "location": get_text("location_of_origin"),
        "image_file": image_file,
        "subgenres": get_links("subgenres"),
        "related": get_links("related_aesthetics"),
        "overlaps": get_links("overlaps_with"),
    }

# --- Lead summary extraction -------------------------------------------------
# The inspector shows the opening paragraph of each article. Extracting it here
# adds no requests: `fetch_wikitext` already downloaded every page.

SUMMARY_MAX_CHARS = 650
SUMMARY_SHORT_PARAGRAPH_CHARS = 220
SUMMARY_MIN_PARAGRAPH_CHARS = 24
HATNOTE_PREFIXES = (
    "not to be confused with",
    "this article is about",
    "this page is about",
    "for other uses",
    "redirects here",
    "main article:",
    "see also:",
)
NON_PROSE_TAGS = {"ref", "references", "gallery", "imagemap", "math", "score", "timeline", "table"}

def _strip_balanced(text, opener, closer):
    """Removes balanced spans textually so malformed HTML cannot hide them."""
    out, depth, i = [], 0, 0
    while i < len(text):
        if text.startswith(opener, i):
            depth += 1
            i += len(opener)
            continue
        if text.startswith(closer, i):
            if depth > 0: depth -= 1
            i += len(closer)
            continue
        if depth == 0: out.append(text[i])
        i += 1
    return "".join(out)

def _lead_plain_text(wikitext):
    """Lead section of an article as plain text (template/table/link markup removed)."""
    # Templates (infobox, hatnotes, citations) and tables go first, as raw
    # spans: a malformed tag inside an infobox can make the template a nested
    # node, which `Wikicode.remove` would silently refuse to delete.
    text = _strip_balanced(wikitext, "{{", "}}")
    text = _strip_balanced(text, "{|", "|}")

    code = mwparserfromhell.parse(text)
    first_heading = next(iter(code.filter_headings()), None)
    if first_heading is not None:
        try:
            code = mwparserfromhell.wikicode.Wikicode(code.nodes[: code.nodes.index(first_heading)])
        except ValueError:
            pass

    for tag in reversed(code.filter_tags(recursive=True)):
        if str(tag.tag).strip().lower() in NON_PROSE_TAGS:
            try: code.remove(tag)
            except ValueError: pass
    for link in reversed(code.filter_wikilinks(recursive=True)):
        if str(link.title).strip().lower().startswith(("file:", "image:", "category:")):
            try: code.remove(link)
            except ValueError: pass

    return code.strip_code(normalize=True, collapse=False)

def _lead_paragraphs(plain):
    paragraphs = []
    for raw in re.split(r"\n\s*\n", plain):
        cleaned = re.sub(r"[\u200b\xa0]", " ", raw)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        cleaned = re.sub(r"\(\s*(?:or|and)?\s*\)", "", cleaned)  # template-only parens
        cleaned = re.sub(r"\s+([,.;:!?])", r"\1", cleaned)
        cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
        if len(cleaned) < SUMMARY_MIN_PARAGRAPH_CHARS: continue
        if cleaned.lower().startswith(HATNOTE_PREFIXES): continue
        if "{{" in cleaned or "}}" in cleaned: continue
        paragraphs.append(cleaned)
    return paragraphs

def _is_prose_block(text):
    """True for a real paragraph, false for a flattened list or table remnant."""
    return len(text) >= 40 and bool(re.search(r"[.!?…][\"'”’)\]]?$", text))

def extract_summary(wikitext, max_chars=SUMMARY_MAX_CHARS):
    """Opening paragraph of an article, or "" for redirects/stubs without prose.

    Articles often open with a hatnote or a one-line stub, so a first paragraph
    shorter than SUMMARY_SHORT_PARAGRAPH_CHARS is joined with the next one —
    but only when that next block is prose, never a bullet list.
    """
    if not wikitext or re.match(r"^\s*#redirect", wikitext, re.IGNORECASE):
        return ""

    paragraphs = _lead_paragraphs(_lead_plain_text(wikitext))
    if not paragraphs:
        return ""

    summary = paragraphs[0]
    if (
        len(summary) < SUMMARY_SHORT_PARAGRAPH_CHARS
        and len(paragraphs) > 1
        and _is_prose_block(paragraphs[1])
    ):
        summary = f"{summary} {paragraphs[1]}"

    if len(summary) > max_chars:
        window = summary[:max_chars]
        cut = max(window.rfind(". "), window.rfind("! "), window.rfind("? "))
        if cut >= max_chars * 0.5:
            summary = window[: cut + 1]
        else:
            summary = window.rsplit(" ", 1)[0].rstrip(" ,;:—-") + "…"
    elif summary.endswith(":"):
        # A lead-in to a bullet list ("...such as:") reads better as a truncation.
        summary = summary[:-1].rstrip() + "…"
    return summary

def resolve_redirects(all_linked_titles, batch_size=50):
    print("[3/5] Resolving page redirects...")
    unique = sorted(set(all_linked_titles))
    redirect_map = {}
    for i in range(0, len(unique), batch_size):
        batch = unique[i : i + batch_size]
        params = {"action": "query", "titles": "|".join(batch), "redirects": 1, "format": "json"}
        res = session.get(API_URL, params=params, timeout=30).json().get("query", {})
        norm = {item["from"]: item["to"] for item in res.get("normalized", [])}
        redir = {item["from"]: item["to"] for item in res.get("redirects", [])}
        for original in batch:
            redirect_map[original.lower()] = redir.get(norm.get(original, original), norm.get(original, original))
        time.sleep(0.3)
    return redirect_map

def resolve_image_urls(filenames, batch_size=50):
    print("[4/5] Resolving image CDN URLs...")
    unique = sorted(set(f for f in filenames if f))
    url_map = {}
    for i in range(0, len(unique), batch_size):
        batch = unique[i : i + batch_size]
        params = {"action": "query", "prop": "imageinfo", "iiprop": "url", "titles": "|".join([f"File:{name}" for name in batch]), "format": "json"}
        res = session.get(API_URL, params=params, timeout=30).json().get("query", {})
        norm = {item["from"]: item["to"] for item in res.get("normalized", [])}
        title_to_url = {info["title"]: info["imageinfo"][0]["url"] for info in res.get("pages", {}).values() if "imageinfo" in info}
        for name in batch:
            canonical = norm.get(f"File:{name}", f"File:{name}")
            if canonical in title_to_url: url_map[name] = title_to_url[canonical]
        time.sleep(0.3)
    return url_map

def _existing_node_count(path):
    """Node count of the dataset already on disk, or 0 if it is missing/unreadable."""
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError):
        return 0
    if isinstance(data, dict):
        nodes = data.get("nodes")
        return len(nodes) if isinstance(nodes, list) else 0
    return len(data) if isinstance(data, list) else 0

def validate_scrape(node_count, output_dir):
    """Exit non-zero instead of overwriting live data with a broken scrape.

    The floor is the stricter of MIN_NODES and MIN_RETENTION_RATIO of the
    dataset already in `output_dir`, so an empty or drastically truncated API
    response fails CI while a genuine slow decline still gets through.
    """
    previous = _existing_node_count(os.path.join(output_dir, "aesthetics_data_tiered.json"))
    retention_floor = int(previous * MIN_RETENTION_RATIO) if previous else 0
    floor = max(MIN_NODES, retention_floor)

    if node_count >= floor:
        print(
            f"      {node_count} nodes (floor {floor}: MIN_NODES={MIN_NODES}, "
            f"{MIN_RETENTION_RATIO:.0%} of previous {previous})."
        )
        return

    reason = "the scrape returned no nodes" if node_count == 0 else "the scrape returned anomalously few nodes"
    print(
        f"\nERROR: {reason}: {node_count} < {floor} "
        f"(MIN_NODES={MIN_NODES}, {MIN_RETENTION_RATIO:.0%} of previous {previous}).\n"
        f"Refusing to overwrite {output_dir}. Fandom is probably down or the API changed.",
        file=sys.stderr,
    )
    raise SystemExit(1)

def write_json_atomic(path, payload):
    """Write via a sibling temp file + rename, so a crash never truncates live data."""
    directory = os.path.dirname(path) or "."
    os.makedirs(directory, exist_ok=True)
    tmp_path = f"{path}.tmp"
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def main():
    titles = get_all_aesthetic_titles()
    raw_pages = fetch_wikitext(titles)

    parsed_pages = {}
    summaries = {}
    all_edge_targets, all_images = [], []

    for title, wikitext in raw_pages.items():
        info = parse_infobox(wikitext)
        parsed_pages[title] = info
        summary = extract_summary(wikitext)
        if summary: summaries[title] = summary
        for field in ["subgenres", "related", "overlaps"]: all_edge_targets.extend(info.get(field, []))
        if info.get("image_file"): all_images.append(info["image_file"])

    redirect_map = resolve_redirects(all_edge_targets)
    image_map = resolve_image_urls(all_images)
    canonical_lookup = {t.lower(): t for t in parsed_pages.keys()}

    def resolve_target(raw_name): return canonical_lookup.get(redirect_map.get(raw_name.lower(), raw_name).lower())

    nodes, edges, seen_edges = [], [], set()

    for title, info in parsed_pages.items():
        nodes.append({
            "id": title,
            "label": title,
            "origin_raw": info.get("origin_raw", ""),
            "year": info.get("year"),
            "motifs": info.get("motifs", ""),
            "colours": info.get("colours", ""),
            "platform": info.get("platform", ""),
            "location": info.get("location", ""),
            "image": image_map.get(info.get("image_file", ""), ""),
            "url": f"https://aesthetics.fandom.com/wiki/{title.replace(' ', '_')}",
        })

        for edge_type, field in [("subgenre", "subgenres"), ("related", "related"), ("overlap", "overlaps")]:
            for target_raw in info.get(field, []):
                target_id = resolve_target(target_raw)
                if target_id and target_id != title:
                    edge_key = tuple(sorted([title, target_id])) + (edge_type,) # Undirected deduping
                    if edge_key not in seen_edges:
                        seen_edges.add(edge_key)
                        edges.append({"source": title, "target": target_id, "type": edge_type})

    print("      Validating scrape size before writing...")
    validate_scrape(len(nodes), OUTPUT_DIR)

    print("[5/5] Running PageRank Centrality algorithm...")
    
    # 1. Build an undirected graph to measure total structural importance
    G = nx.Graph()
    for node in nodes:
        G.add_node(node["id"])
    for edge in edges:
        G.add_edge(edge["source"], edge["target"])

    # 2. Calculate PageRank
    pagerank_scores = nx.pagerank(G, alpha=0.85)

    # 3. Sort nodes by score to establish percentiles
    sorted_by_pr = sorted(pagerank_scores.items(), key=lambda x: x[1], reverse=True)
    total_nodes = len(sorted_by_pr)

    # 4. Assign Tier buckets
    # Tier 1: Top 2% (Macro-aesthetics like Cyberpunk, Gothic)
    # Tier 2: Next 13% (Major genres)
    # Tier 3: Next 35% (Established niches)
    # Tier 4: Bottom 50% (Micro-labels, rare aesthetics)
    tier_map = {}
    for idx, (node_id, score) in enumerate(sorted_by_pr):
        percentile = 1.0 - (idx / total_nodes)
        if percentile >= 0.98: tier = 1
        elif percentile >= 0.85: tier = 2
        elif percentile >= 0.50: tier = 3
        else: tier = 4
        tier_map[node_id] = {"score": score, "tier": tier}

    # 5. Inject Tier data back into the nodes
    for node in nodes:
        node["pagerank"] = tier_map[node["id"]]["score"]
        node["tier"] = tier_map[node["id"]]["tier"]

    output_path = os.path.join(OUTPUT_DIR, "aesthetics_data_tiered.json")
    write_json_atomic(
        output_path,
        {"stats": {"nodes": len(nodes), "edges": len(edges)}, "nodes": nodes, "edges": edges},
    )

    # Lead summaries live in their own artifact so the graph payload stays small
    # and the inspector can upgrade itself after first paint.
    summaries_path = os.path.join(OUTPUT_DIR, "aesthetics_summaries.json")
    write_json_atomic(summaries_path, dict(sorted(summaries.items())))

    print(f"\nDone! Saved to {output_path}")
    print(f"Summaries: {len(summaries)}/{len(raw_pages)} articles -> {summaries_path}")
    print("\nSample Tiers Assigned:")
    for i in range(1, 5):
        sample = [n[0] for n in sorted_by_pr if tier_map[n[0]]["tier"] == i][:3]
        print(f"  Tier {i}: {', '.join(sample)}...")

if __name__ == "__main__":
    main()