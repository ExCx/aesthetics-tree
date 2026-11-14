# Aesthetics Tree

**An interactive, chronological map of internet aesthetics.**

[**Open the live map →**](https://aesthetics-tree.epicum.workers.dev)

Aesthetics Tree turns the [Aesthetics Wiki](https://aesthetics.fandom.com/wiki/Aesthetics_Wiki)'s infobox graph into a single explorable canvas: **1,100+ aesthetics** and **6,000+ typed connections**, laid out by decade and cross-linked by subgenre, ancestry and overlap.

Most aesthetics resources are alphabetical lists. This one answers questions a list cannot: *what came before cottagecore?*, *which micro-labels descend from cyberpunk?*, *what was happening in the 1990s?*

## Features

- **Chronological swimlanes** — one lane per decade (Pre-1900 through the 2020s, plus Undated), ordered left to right and colour-coded by era.
- **PageRank tiers** — the wiki's articles are ranked by graph centrality and split into four tiers (top 2%, next 13%, next 35%, bottom 50%). Important hubs stay visible when zoomed out; niche labels appear as you zoom in.
- **Lineage spotlighting** — selecting an aesthetic highlights its ancestors, descendants and overlaps, with a depth slider from 1 to 4 hops or unlimited. Only the active lineage is drawn; there are no ambient background edges.
- **Instant fuzzy search** — across titles, motifs, platforms and origins, with a live results dropdown and lineage highlighting for every match.
- **Inspector drawer** — cover image, the article's lead paragraph (CC BY-SA), key motifs, colours, origin, platforms, year and tier, with a direct link to the wiki page.
- **Canvas-native rendering** — pan, zoom, hover and thumbnails run on a dirty-flagged `requestAnimationFrame` loop with zero React re-renders during interaction, DPR-aware drawing, spatial-hash hit-testing and detail levels for dots, cards and images.
- **Bounded camera** — the map cannot be panned into empty space; fit-to-screen and focus-node account for the inspector drawer.
- **Keyboard shortcuts** — `/` focuses search, `Escape` clears search then selection.
- **Daily data refresh** — a scheduled GitHub Action re-scrapes the wiki and commits both JSON artifacts; a failed or anomalously small scrape never overwrites live data.

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19, TypeScript 6, Tailwind CSS v4 |
| Build | Vite 8 |
| Rendering | Canvas 2D — no graph or charting library |
| Scraper | Python 3.12, `requests`, `mwparserfromhell`, `networkx` |
| Hosting | Cloudflare Workers static assets (free CDN) |

## Quick start

Requires **Node.js 22.12+** (Vite 8) and npm.

```bash
git clone https://github.com/ExCx/aesthetics-tree.git
cd aesthetics-tree
npm ci
npm run dev
```

The app auto-loads `public/aesthetics_data_tiered.json` on mount and fetches `public/aesthetics_summaries.json` after the graph is on screen. There is no sample dataset, upload button or drag-and-drop path: the map is always the committed scraper output.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b && vite build` → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (flat config, React Hooks rules) |
| `npx tsc -b` | Type-check only |
| `npm run deploy` | `wrangler deploy` (Cloudflare Workers) |

## How the data is made

The scraper in `aesthetics-scraper/` talks to the wiki's MediaWiki API, parses every `Template:Aesthetic` infobox, resolves redirects and image CDN URLs, extracts each article's lead paragraph, and computes PageRank tiers with NetworkX.

```text
MediaWiki API
   │  titles + wikitext + image URLs
   ▼
fetch_aesthetics.py
   ├── extract_summary() ──▶ public/aesthetics_summaries.json
   └── parse_infobox() + PageRank ──▶ public/aesthetics_data_tiered.json
                                             │
                                       normalizeGraphDataset()
                                             ▼
                                       layout + canvas
```

Run it locally (writes straight to `public/`):

```bash
pip install -r aesthetics-scraper/requirements.txt
python aesthetics-scraper/fetch_aesthetics.py
```

Safety rails: before writing, the script exits non-zero if the new node count is below `MIN_NODES` (default 500) or below 50% of the dataset already on disk. Both JSON files are written atomically via a temp file and rename, so a Fandom outage or a crashed run cannot truncate live data.

The GitHub Action [`.github/workflows/refresh-aesthetics-data.yml`](.github/workflows/refresh-aesthetics-data.yml) runs this daily and commits the refreshed artifacts.

### Artifacts

| File | Contents | Size |
|---|---|---|
| `public/aesthetics_data_tiered.json` | Nodes, typed edges, PageRank, tier | ~1.3 MB |
| `public/aesthetics_summaries.json` | `{ "<node id>": "<lead paragraph>" }` | ~505 KB |

The summaries are a lookup only: they never enter the normalized graph, trigger a relayout or touch the canvas. A missing file or key simply hides the paragraph.

## Project structure

```text
public/                  Committed data artifacts, favicon and _headers
src/
├── AestheticsTree.tsx   Thin orchestrator: UI state, hooks, layout shell
├── canvas/              Renderer, camera math, hit-testing, image cache
├── components/          Top bar, filters, inspector, controls, overlays
├── data/                Dataset normalization (both JSON formats)
├── graph/               Types, eras, tiering, lineage, search, layout
└── hooks/               Dataset autoload + deferred summaries
aesthetics-scraper/      MediaWiki scraper, summary extraction, tiering
wrangler.jsonc           Cloudflare Workers static-asset config
```

`AGENTS.md` documents the architecture, invariants and module boundaries in detail.

## Deployment

The site is a static Vite build served by Cloudflare Workers static assets; there is no Worker script. `wrangler.jsonc` points Cloudflare at `./dist` and serves `index.html` for unknown paths.

| Workers Builds setting | Value |
|---|---|
| Production branch | `master` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | *(empty)* |
| Build variable | `NODE_VERSION=22` |

`public/_headers` is copied into the build output and sets immutable caching for hashed `/assets/*`, five-minute revalidation for the daily JSON artifacts, and baseline security headers.

Do **not** add `@cloudflare/vite-plugin` to this project: it relocates the client build to `dist/client` and generates a different Wrangler config.

## Data format

```json
{
  "stats": { "nodes": 1126, "edges": 6162 },
  "nodes": [
    {
      "id": "Cyberpunk",
      "label": "Cyberpunk",
      "origin_raw": "Early 1980s",
      "year": 1982,
      "motifs": "Neon megacities, cybernetics, rain...",
      "colours": "Cyan, magenta, black, electric blue",
      "platform": "Sci-Fi Literature, Cinema, Anime",
      "location": "Global",
      "image": "https://static.wikia.nocookie.net/...",
      "url": "https://aesthetics.fandom.com/wiki/Cyberpunk",
      "pagerank": 0.008412,
      "tier": 1
    }
  ],
  "edges": [{ "source": "Punk", "target": "Cyberpunk", "type": "related" }]
}
```

`year` may be `null` (bucketed as **Undated**); all layout and canvas math guards against `NaN`.

## License and attribution

- **Code**: [MIT](LICENSE).
- **Article text and images**: from the [Aesthetics Wiki](https://aesthetics.fandom.com/), licensed **CC BY-SA**. The inspector attributes each lead paragraph and links the source article. Image URLs point at Fandom's CDN; images are not redistributed in this repository.
- Tiering is a heuristic derived from wiki link structure, not an authoritative taxonomy. The wiki is community-maintained, so entries and dates can be incomplete or disputed.
