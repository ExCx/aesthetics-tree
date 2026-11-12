# AGENTS.md

## Architecture & Boundaries

This repository has two distinct parts:
1. **Frontend (`src/`, root config)**: A React 19 + TypeScript + Vite 8 + Tailwind CSS v4 interactive chronological graph explorer.
   - `src/AestheticsTree.tsx` is a monolithic component containing the entire application: built-in fallback dataset, data normalization, barycenter chronological layout engine, 256×256 spatial hash grid, imperative HTML5 `<canvas>` 60fps render loop, and React UI overlays.
   - `src/App.tsx` simply renders `<AestheticsTree />`.
   - `src/App.css` and `src/assets/` are unused Vite template leftovers; styling uses Tailwind v4 (`@import "tailwindcss";` in `src/index.css`).
2. **Scraper (`aesthetics-scraper/`)**: A standalone Python 3.12 script (`fetch_aesthetics.py`) that queries the Aesthetics Wiki MediaWiki API (`aesthetics.fandom.com/api.php`), parses `Template:Aesthetic` infoboxes, resolves redirects/image URLs, computes NetworkX PageRank tiers (1–4), and outputs `aesthetics_data_tiered.json`.

## Data Flow & Dataset Gotchas

- **Filename mismatch on autoload**: On mount, `src/AestheticsTree.tsx` fetches `./aesthetics_data.json` (which resolves to `public/aesthetics_data.json`). However, `aesthetics-scraper/fetch_aesthetics.py` writes `aesthetics_data_tiered.json` (to `OUTPUT_DIR`, defaulting to `.`). To bundle or auto-load scraped data in the web app without manual drag-and-drop/file upload, copy or output the JSON to `public/aesthetics_data.json`.
- **Unused scraper fields in UI**: The scraper computes `pagerank` and `tier` (1–4) for each node in `aesthetics_data_tiered.json`, but `normalizeGraphDataset` in `src/AestheticsTree.tsx` currently strips them and only computes raw `degree` (`parents.length + children.length + peers.length`).
- **Dual JSON format support**: `normalizeGraphDataset` accepts either `{ nodes: [...], edges: [...] }` or a flat array of node objects `[...]` with inline `subgenres`, `related`, and `overlaps` arrays.

## Commands

### Frontend (Root)
- **Dev server**: `npm run dev`
- **Build**: `npm run build` (runs `tsc -b && vite build`)
- **Typecheck only**: `npx tsc -b`
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

- **Imperative Canvas Architecture**: Pan, zoom, and pointer hover state in `src/AestheticsTree.tsx` intentionally bypass React state (`cameraRef`, `dirtyRef`, `hoveredIdRef`, `tooltipRef`) to maintain a 60fps `requestAnimationFrame` loop without React re-renders. Do not convert high-frequency canvas pointer/camera state into `useState`.
- **Precomputed Layout & Rendering**: Text truncation, badge widths, and `Path2D` Bézier curves are precomputed inside `computeChronologicalLayout` (using an offscreen canvas context) rather than inside the `renderScene` loop. Keep `measureText` and `shadowBlur` out of `renderScene`.
- **Current TypeScript / ESLint State**: `src/AestheticsTree.tsx` was written as untyped JS inside a `.tsx` file. Running `npm run build` (`tsc -b`) currently fails with implicit `any` and untyped `useRef(null)` / `useState(null)` errors, and `npm run lint` reports 3 errors (`react-hooks/set-state-in-effect`, `react-hooks/refs`, `no-useless-assignment`). Use `npx vite build` if you need to test bundling before TypeScript types are fixed, or type `AestheticsTree.tsx` when touching it.
