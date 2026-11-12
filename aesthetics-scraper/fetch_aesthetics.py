import json
import os
import re
import time
import mwparserfromhell
import requests
import networkx as nx

API_URL = "https://aesthetics.fandom.com/api.php"
HEADERS = {"User-Agent": "AestheticsChronologyTree/2.0 (Educational Project)"}
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", ".")

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

def main():
    titles = get_all_aesthetic_titles()
    raw_pages = fetch_wikitext(titles)

    parsed_pages = {}
    all_edge_targets, all_images = [], []

    for title, wikitext in raw_pages.items():
        info = parse_infobox(wikitext)
        parsed_pages[title] = info
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
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            {"stats": {"nodes": len(nodes), "edges": len(edges)}, "nodes": nodes, "edges": edges},
            f, indent=2, ensure_ascii=False,
        )

    print(f"\nDone! Saved to {output_path}")
    print("\nSample Tiers Assigned:")
    for i in range(1, 5):
        sample = [n[0] for n in sorted_by_pr if tier_map[n[0]]["tier"] == i][:3]
        print(f"  Tier {i}: {', '.join(sample)}...")

if __name__ == "__main__":
    main()