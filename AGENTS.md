# AGENTS.md

## Architecture & Boundaries

This repository has two distinct parts:
1. **Frontend (`src/`, root config)**: A React 19 + TypeScript + Vite 8 + Tailwind CSS v4 interactive chronological graph explorer.
   - `src/AestheticsTree.tsx` is a monolithic component containing the entire application: built-in fallback dataset, data normalization, barycenter chronological layout engine, 256×256 spatial hash grid, imperative HTML5 `<canvas>` 60fps render loop, zoom-based PageRank tier progressive disclosure, lazy Fandom CDN thumbnail rendering, and React UI overlays.
   - `src/App.tsx` simply renders `<AestheticsTree />`.
   - `src/App.css` and `src/assets/` are unused Vite template leftovers; styling uses Tailwind v4 (`@import "tailwindcss";` in `src/index.css`).
2. **Scraper (`aesthetics-scraper/`)**: A standalone Python 3.12 script (`fetch_aesthetics.py`) that queries the Aesthetics Wiki MediaWiki API (`aesthetics.fandom.com/api.php`), parses `Template:Aesthetic` infoboxes, resolves redirects/image CDN URLs, computes NetworkX PageRank centrality tiers (1–4), and outputs `aesthetics_data_tiered.json`.

## Folder Layout

```text
/
├── public/
│   └── aesthetics_data_tiered.json   # Auto-loaded scraper output on mount
├── src/
│   ├── AestheticsTree.tsx            # Monolithic Canvas 2D + React explorer
│   ├── App.tsx                       # Root wrapper
│   ├── index.css                     # Tailwind v4 entrypoint
│   └── main.tsx                      # React DOM entry
└── aesthetics-scraper/
    ├── Dockerfile                    # Python 3.12 container
    ├── requirements.txt              # requests, mwparserfromhell, networkx
    └── fetch_aesthetics.py           # MediaWiki API scraper + PageRank tiering
```

## `aesthetics_data_tiered.json` Schema

```json
{
  "stats": { "nodes": 2150, "edges": 8420 },
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
      "image": "https://static.wikia.nocookie.net/aesthetics/images/...",
      "url": "https://aesthetics.fandom.com/wiki/Cyberpunk",
      "pagerank": 0.008412,
      "tier": 1
    }
  ],
  "edges": [
    {
      "source": "Punk",
      "target": "Cyberpunk",
      "type": "related"
    }
  ]
}
```

- **PageRank Tiers (`tier`)**:
  - `1`: Top 2% (Macro-aesthetics / major root hubs like Cyberpunk, Gothic)
  - `2`: Next 13% (Major genres)
  - `3`: Next 35% (Established niches)
  - `4`: Bottom 50% (Micro-labels, rare aesthetics)
- **Dual JSON format support**: `normalizeGraphDataset` accepts either `{ nodes: [...], edges: [...] }` or a flat array of node objects `[...]` with inline `subgenres`, `related`, and `overlaps` arrays. If an untiered dataset is loaded, `normalizeGraphDataset` automatically computes fallback `tier` (1–4) and `pagerank` values from node degree percentiles.
- **Data Safety (`"year": null`)**: Many wiki articles lack an origin year (`"year": null`, bucketed into `"Undated"`). All layout and canvas math explicitly guards against `NaN` coordinates.

## Commands

### Frontend (Root)
- **Dev server**: `npm run dev`
- **Build**: `npm run build` (runs `tsc -b && vite build`)
- **Typecheck only**: `npx tsc --noEmit` or `npx tsc -b`
- **Lint**: `npm run lint` (ESLint 10 flat config with `eslint-plugin-react-hooks` v7 strict rules)
- **Tests**: No test runner or test suite is configured.

### Scraper (`aesthetics-scraper/`)
- **Docker**:
  ```bash
  docker build -t aesthetics-scraper ./aesthetics-scraper
  docker run --rm -v "$(pwd)/public:/output" aesthetics-scraper
  ```
- **Local Python**:
  ```bash
  pip install -r aesthetics-scraper/requirements.txt
  OUTPUT_DIR=./public python aesthetics-scraper/fetch_aesthetics.py
  ```

## Codebase Quirks & Constraints

- **Imperative Canvas Architecture**: Pan, zoom, pointer hover state, and lazy-loaded image thumbnails in `src/AestheticsTree.tsx` intentionally bypass React state (`cameraRef`, `dirtyRef`, `hoveredIdRef`, `tooltipRef`, `imageCacheRef`) to maintain a 60fps `requestAnimationFrame` loop without React re-renders. Do not convert high-frequency canvas pointer/camera/image state into `useState`.
- **Active-Lineage Edges Only (No Ambient Background Edges)**: Ambient background edges for inactive nodes are intentionally disabled at all zoom levels to keep mid-zoom rendering fast and uncluttered. Only edges belonging to the active selected node's lineage (ancestors, descendants, peers), the currently hovered node, or active search matches are batched and drawn.
- **Dot-to-Card LOD & Inverse-Zoom Labels**: Nodes stay in lightweight dot mode below `80%` zoom (`k < 0.80`), transitioning to detailed pill cards at `k >= 0.80` and lazy-loaded thumbnails at `k >= 0.95`. In dot mode (`k < 0.80`), node titles are rendered in screen space **above** each dot using inverse-zoom font sizing (`~14.5px` at far zoom tapering to `11.5px` by `80%` zoom) with collision-box filtering prioritized by Selected/Hovered -> Lineage/Search -> Tier 1 -> Tier 2 -> PageRank.
- **Precomputed Layout & Rendering**: Text truncation (both standard and thumbnail-indented), badge widths, and `Path2D` Bézier curves are precomputed inside `computeChronologicalLayout` (using an offscreen canvas context) rather than inside the `renderScene` loop. Keep `measureText` and `shadowBlur` out of `renderScene`.
- **Fandom CDN Thumbnails**: Canvas `HTMLImageElement` instances must set `img.referrerPolicy = 'no-referrer'` and must **not** set `img.crossOrigin = 'anonymous'` (Fandom/Wikia CDN often fails CORS preflight checks, and canvas pixel readback is not used).
