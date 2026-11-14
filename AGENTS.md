# AGENTS.md

## Architecture & Boundaries

This repository has two distinct parts:

1. **Frontend (`src/`, root config)**: A React 19 + TypeScript + Vite 8 + Tailwind CSS v4 interactive chronological graph explorer.
   - `src/AestheticsTree.tsx` is a **thin orchestrator** (~400 lines): low-frequency React UI state, memoized graph/lineage/layout, hook wiring, and JSX composition. It must not accumulate rendering, layout or pointer-handling logic.
   - `src/App.tsx` simply renders `<AestheticsTree />`.
   - `src/App.css` and `src/assets/` are unused Vite template leftovers; styling uses Tailwind v4 (`@import "tailwindcss";` in `src/index.css`).
2. **Scraper (`aesthetics-scraper/`)**: A standalone Python 3.12 script (`fetch_aesthetics.py`) that queries the Aesthetics Wiki MediaWiki API (`aesthetics.fandom.com/api.php`), parses `Template:Aesthetic` infoboxes, resolves redirects/image CDN URLs, computes NetworkX PageRank centrality tiers (1–4), and outputs `aesthetics_data_tiered.json`.

## Folder Layout

```text
/
├── public/
│   └── aesthetics_data_tiered.json   # Auto-loaded scraper output on mount
├── src/
│   ├── AestheticsTree.tsx            # Thin orchestrator: UI state + hook wiring + layout shell
│   ├── App.tsx                       # Root wrapper
│   ├── index.css                     # Tailwind v4 entrypoint
│   ├── main.tsx                      # React DOM entry
│   │
│   ├── data/
│   │   └── normalizeGraph.ts         # normalizeGraphDataset: dual JSON formats, edge classification, fallback tiers
│   │
│   ├── graph/
│   │   ├── types.ts                  # LEAF: all shared Raw/Normalized/Layout/Camera/Scene types
│   │   ├── constants.ts              # Layout geometry, camera limits, fonts, canvas palette
│   │   ├── eras.ts                   # ERA_BUCKETS, ERA_COLOR_MAP, getEraBucketId
│   │   ├── tiering.ts                # getNodeTierAlpha + LOD thresholds + label release rules
│   │   ├── colours.ts                # NAMED_COLORS + parseColourSwatches (inspector only)
│   │   ├── lineage.ts                # computeLineage (ancestors / descendants / peers)
│   │   ├── search.ts                 # searchGraph (fuzzy label/motifs/platform/origin)
│   │   └── layout.ts                 # Barycenter layout, subrows, text truncation, Path2D, spatial grid
│   │
│   ├── canvas/
│   │   ├── primitives.ts             # drawRoundedRect + setAlpha
│   │   ├── camera.ts                 # Pure camera math: fit/focus/zoom-at-point/clamp
│   │   ├── hitTest.ts                # O(1) spatial-hash pointer hit-testing
│   │   ├── imageCache.ts             # Lazy Wikia thumbnail loader (referrerPolicy only)
│   │   ├── drawEdges.ts              # Active lineage/hover/search Path2D batches
│   │   ├── drawNodes.ts              # Dot mode + pill-card mode + thumbnails
│   │   ├── drawLabels.ts             # Inverse-zoom dot titles + sticky decade badges
│   │   ├── renderScene.ts            # One frame: clear, lanes, edges, nodes, labels, badges
│   │   ├── useCanvasEngine.ts        # ResizeObserver + DPR + dirty-flagged RAF loop (mounted once)
│   │   └── useCanvasInteractions.ts  # Wheel/drag/click/touch/pinch + imperative tooltip
│   │
│   ├── hooks/
│   │   └── useDatasetSource.ts       # public/ autoload only (no sample / upload / drop)
│   │
│   └── components/
│       ├── TopBar.tsx                # Header, search field + results dropdown, node counter
│       ├── FilterPanel.tsx           # Scrollable filter body + collapse toggle
│       ├── LineageLegend.tsx         # Always-visible legend, top bar beside the node counter
│       ├── MapControls.tsx           # Zoom in/out + zoom readout + fit view
│       ├── InspectorDrawer.tsx       # Right slide-over inspector
│       └── Overlays.tsx              # HoverTooltip + Toast
│
└── aesthetics-scraper/
    ├── Dockerfile                    # Python 3.12 container
    ├── requirements.txt              # requests, mwparserfromhell, networkx
    └── fetch_aesthetics.py           # MediaWiki API scraper + PageRank tiering
```

### Where new code goes

| If you are adding… | Put it in… |
|---|---|
| A new visual layer, halo, badge or canvas effect | `canvas/draw*.ts` (called from `renderScene.ts`) |
| A new per-frame layout coordinate or collision rule | `graph/layout.ts` |
| A new dataset field or edge type | `graph/types.ts` + `data/normalizeGraph.ts` |
| A new searchable field | `graph/search.ts` |
| A new zoom/LOD threshold | `graph/tiering.ts` (never inline in a draw call) |
| A new camera movement | `canvas/camera.ts` (pure), then call it from a hook |
| A new panel/button/drawer section | `components/` |
| New UI state | `AestheticsTree.tsx` — and only if it is low-frequency |

### Data flow

```text
rawDataset ──normalizeGraphDataset──▶ NormalizedGraph
                                        │
                    computeLineage ◀────┼────▶ searchGraph
                                        ▼
                              filteredNodes ──computeChronologicalLayout──▶ LayoutResult
                                                                              │
sceneRef {layout, selection, lineage, search, toggles} ──▶ useCanvasEngine ──▶ renderScene
                                                                              │
                                                              hitTest (same tier rules)
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
- **Dual JSON format support**: `normalizeGraphDataset` (`src/data/normalizeGraph.ts`) accepts either `{ nodes: [...], edges: [...] }` or a flat array of node objects `[...]` with inline `subgenres`, `related`, and `overlaps` arrays. If an untiered dataset is loaded, it automatically computes fallback `tier` (1–4) and `pagerank` values from node degree percentiles.
- **Data Safety (`"year": null`)**: Many wiki articles lack an origin year (`"year": null`, bucketed into `"Undated"`). All layout and canvas math explicitly guards against `NaN` coordinates.

## Commands

### Frontend (Root)
- **Dev server**: `npm run dev`
- **Build**: `npm run build` (runs `tsc -b && vite build`)
- **Typecheck only**: `npx tsc -b` (or `npx tsc --noEmit`)
- **Lint**: `npm run lint` (ESLint 10 flat config with `eslint-plugin-react-hooks` v7 strict rules, including `react-hooks/refs`)
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

## Non-Negotiable Invariants

These are load-bearing. Do not "clean up" or refactor them away.

### 1. Zero React re-renders on interaction
Pan, zoom, pinch, hover and thumbnail loading must stay purely imperative:
- `cameraRef`, `dirtyRef`, `hoveredIdRef`, `dragStateRef` and the image cache are mutable refs.
- `useCanvasEngine` mounts exactly once (`[]`-style stable deps) and owns the `requestAnimationFrame` loop.
- `useCanvasInteractions` mutates refs and sets `dirtyRef.current = true`; never call `setState` from a move/zoom handler.
- Never move camera coordinates, hover state or frame ticks into `useState`.
- Never read `.current` during render (`react-hooks/refs` fails lint); do it in effects/handlers.

### 2. Synchronized culling & hit-testing
`canvas/drawNodes.ts` and `canvas/hitTest.ts` must agree at every zoom level:
- Both import `getNodeTierAlpha` and `DOT_MODE_MAX_ZOOM` from `graph/tiering.ts`.
- Both use the same "important" bypass set: selected + lineage family + search matches. (The renderer additionally bypasses the hovered node and its direct neighbours, because hover cannot depend on a hit-test result.)
- The dot/card geometry switch is `k < 0.80`; card hit boxes are `node.width/2 + 3` by `node.height/2 + 3`; dot hit radius is `max(12 / k, dotRadius + 4)`.
- Never add a tier threshold, opacity ramp or visibility rule inline in only one of the two modules.

### 3. Precomputed render artifacts
Everything expensive is computed in `graph/layout.ts`, never per frame:
- `x`/`y`, swimlane bands, `dotRadius`, degree badge widths, pre-truncated labels (`truncatedLabel`, `truncatedLabelThumb`, `labelWidth`) and `Path2D` edge curves.
- `measureText` lives only in `graph/layout.ts` (via `getMeasureContext`).
- `renderScene` and the `draw*` modules must stay free of `measureText` and `shadowBlur`.
- Dot-mode label truncation is character-based using the pre-measured `labelWidth`.

### 4. Null-safe year handling
`"year": null` is normal. Preserve every `Number.isFinite` guard in:
- `getEraBucketId` (→ `"Undated"`),
- `computeChronologicalLayout` (era sort keys use `9999`, coordinates fall back to band center, intra-era offset is guarded),
- `camera.ts` / `hitTest.ts` / `renderScene.ts` (camera `scale`/`x`/`y` fallbacks).
A `NaN` must never reach a transform, a `Path2D`, or the spatial grid.

### 5. Wikia CDN image rules
Any lazy loader for Fandom/Wikia thumbnails must:
- set `img.referrerPolicy = 'no-referrer'`,
- **omit `crossOrigin` entirely** (setting it triggers CORS failures on the Wikia CDN; canvas pixel readback is not used),
- cap concurrent in-flight loads (currently 8) and return `null` while loading / on error.
This applies to `canvas/imageCache.ts` and to the inspector `<img>` (`referrerPolicy="no-referrer"`).

### 6. Tailwind v4 & existing UX
Preserve all styling and interaction behaviour:
- Tailwind v4 utility classes in `components/`; no CSS-in-JS, no new stylesheet.
- Keyboard shortcuts (`/` focus search, `Escape` clears/handles search then selection).
- Fuzzy search dropdown + search lineage spotlighting.
- Lineage depth slider (default **1** = direct roots/successors only; stops 2, 3, 4 and **All** = unlimited). `computeLineage` owns the BFS cap; never re-implement depth filtering in a draw call.
- The lineage legend lives in the top bar, immediately left of the node counter. The collapsible filter body is height-bounded to `bottom-[5.5rem]` (clear of the zoom cluster) and scrolls internally. Keep `pointer-events-none` on the panel's full-height column so the empty area beside the toggle never blocks canvas panning.
- Dataset is loaded from `public/` only: there is no built-in sample, no upload button, no drag & drop and no reset-to-sample. Do not re-introduce them.
- Right-hand inspector drawer slide-over (drawer width `380px`, desktop breakpoint `768px`) and the `fitToScreen`/`focusNode` offsets that account for it.
- Active-lineage-only edges: **do not** re-introduce ambient background edges at any zoom level.
- Dot→card LOD at `k >= 0.80`, thumbnails at `k >= 0.95`, inverse-zoom titles above dots with collision priority Selected/Hovered → Lineage/Search → Tier 1 → Tier 2 → PageRank.

### 7. Bounded camera
The map must never be pannable into a blank void:
- `canvas/camera.ts` owns `computePanLimits` / `clampCameraToBounds`; `PAN_MIN_VISIBLE_FRACTION` (0.5) is the minimum viewport overlap with `layout.bounds`.
- Call `clampCameraToBounds` after **every** user-driven camera mutation: wheel zoom, button zoom, mouse drag, single-finger pan, pinch, `fitToScreen` and `focusNode`.
- Limits use the same `availableViewport` as fit/focus, so a fitted graph stays exactly centred instead of being nudged.
- `clampValue` maps non-finite input to a limit: a `NaN`/`Infinity` camera can never persist.
- Drag handlers re-anchor `origCamX`/`origCamY` after clamping to avoid a dead zone when reversing direction at a bound.

## Engineering Rules

- `tsconfig.app.json` enables `verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters` and `erasableSyntaxOnly`.
  - Use `import type { … }` for type-only imports.
  - No `enum`, no parameter properties, no namespaces.
- `src/graph/types.ts` is a leaf module: it must not import from `data/`, `canvas/`, `hooks/` or `components/`. Keep the dependency direction `types → graph → data/canvas → hooks → components → AestheticsTree`.
- `.tsx` files in `components/` should export components only (react-refresh rule). Types and helpers belong in `.ts` modules.
- Keep modules small and single-purpose (~150–400 lines). `graph/layout.ts` (~390) is the whole precompute pass and is the only intentional outlier.
- Canvas modules must not import React state hooks (`useState`) or each other's render functions circularly; `renderScene` is the only orchestrator of draw calls.
- Any change to `graph/tiering.ts`, `graph/constants.ts` or `graph/layout.ts` requires `npx tsc -b`, `npm run lint`, and `npm run build`, plus a manual check of pan/zoom/hover/search/inspector.
