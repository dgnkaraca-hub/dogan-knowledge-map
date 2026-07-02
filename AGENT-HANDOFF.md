# Agent handoff — current state (read me first)

> **This file is the source of truth for the CURRENT design.** `README.md` and
> `HANDOFF.md` describe an earlier version (a "galaxy / force-directed web" on a
> warm-paper, then space-blue theme). The app has since been redesigned twice.
> Where they conflict with this file, **this file wins.**

## What it is now

An interactive single-page portfolio for **Doğan Karaca**, drawn as a
**hexagonal honeycomb circuit on a pure-black background** in space-blue and
star-white. Three views:

1. **MAP — network (default):** a hex honeycomb. Every node snaps onto a
   pointy-top hex lattice — center cell in the middle, the 7 domains on an inner
   radius, each domain's 5 leaves fanned across an outer field. A faint full
   honeycomb field fills the canvas and each occupied node sits in a brighter,
   softly-shimmering hex cell. Connectors are **hex-aligned elbow traces** (two
   segments along 60° axes) like circuit routing; relation threads are dashed
   with **flowing "current"**. Nodes glow as blue-white star-points. Drag a node
   and it **springs back to its hex cell** on release.
2. **MAP — focus:** click a domain → it eases to a bottom-center hub, its leaves
   fan upward as a tree (staggered, petal-by-petal), its name rises as a ghost
   watermark, others dim to rim labels, `← / →` (or the on-screen arrows) cycle
   domains, `Esc`/click-outside returns. Connectors are straight here.
3. **DASHBOARDS:** a structured reading view derived from `mapData` — a
   practice-overview stat strip (domains / facets / threads / works, computed),
   one card per domain (nothing cherry-picked), a cross-domain **Connections**
   card, plus selected works / skills / contact. Cards carry the map's depth
   language (`.dash-card`).

Plus, across all views:

- **⌘K / Ctrl+K command palette** (`CommandPalette.tsx`) — searches domains,
  facets, selected works, and tags; focuses a domain, opens a node's drawer,
  switches views, resets. Keyboard: ↑ ↓ Enter Esc. No external dependency.
- **Rich detail drawer** (`DetailDrawer.tsx`) — status chip, year/role/location
  facts, metrics grid, extended reading, tags, links, **related nodes derived
  from the relation threads** (clickable, navigates between drawers), optional
  relation "why" sentences, and a subtle **source/confidence footnote**.
  Threads touching the selected node brighten on the map (`.thread.is-related`).

URL hash deep-links the focused domain (`#/domain/<id>`) **and the Dashboards
view (`#/dash`)** — both shareable and restored on reload.

## Data-trust model

`mapData.ts` defines `Confidence` (`confirmed` / `user-provided` / `imported` /
`inferred` / `draft` / `placeholder`) and `SourceInfo`. Anything with a public
link in this repo is `confirmed`; project-notes claims (684-campaign study,
145+ orgs outreach, 600k+ streams, Yeditepe workshop, Sam'al & Göbekli figures)
are `user-provided` / `project-import`; the contact email is marked
`placeholder` in the UI. **Do not upgrade a claim's confidence without a
source.** `RelationEdge` supports optional `type` / `label` / `strength` /
`note`; `ChildNode` supports `extended`, `status`, `year`, `location`, `role`,
`metrics`, `confidence`, `source`, `relatedActions`, `relatedIds` — all
optional, so the plain form keeps working.

## Stack & scripts

Vite 5 · React 18 · TypeScript 5 (strict, `noUnusedLocals`/`noUnusedParameters`)
· Tailwind 3 · Framer Motion 11 · d3-force (now used only as a types/utility
dependency — see below).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build  -> dist/   (must stay green)
npm run preview

# self-contained single file (opens from disk, no server) -> dist-standalone/index.html
npx vite build --config vite.config.singlefile.ts
```

## Architecture (current)

- **`src/data/mapData.ts`** — single source of content. `center`, 7 `domains`
  (each has `id`, `label`, `blurb`, **`color`** [blue→white], `children`),
  `relations` (cross-domain "threads"), and Dashboards data (`selectedWorks`,
  `skillGroups`, `contact`). Edit here to change content.
- **`src/lib/layout.ts`** — pure geometry (no React/DOM):
  - `geometryRadii(area)` — shared circular radii.
  - **Hex helpers:** `hexSize`, `axialToPixel`, `pixelToAxial` (private),
    `hexPath` (cell polygon), `honeycombCells` (the field), **`hexElbowPath`**
    (60°-axis circuit routing for connectors).
  - **`computeNetwork`** — snaps nodes onto the hex lattice (with a `claim()`
    step-out so no two share a cell). *No force solve anymore.*
  - `computeTargets` — per-node targets for both views (network = hex homes,
    focus = fan tree), label/line/ghost state. `sizeForDegree` (tunable `SIZE`)
    grows nodes by connectivity.
  - `buildGraph` — nodes + lines; relation threads are straight (`curve: 0`),
    tinted by source domain.
- **`src/hooks/useForceGraph.ts`** — the live engine. One `requestAnimationFrame`
  loop **eases every node toward its target** each frame (dt-normalized so 60/120Hz
  match; snaps within 0.3px), writes transforms + connector `<path>` `d`
  straight to the DOM. Connectors use `hexElbowPath` in the network view,
  straight in focus. Drag controls (`startDrag/moveDrag/endDrag`): the dragged
  node follows the pointer directly and springs home on release. Loop is
  visibility-gated; honors reduced-motion. **The d3-force simulation has been
  removed** — layout is fully deterministic; `d3-force` remains a dependency
  only for the `SimulationNodeDatum` type used by `SimNode` in `layout.ts`
  (and the still-exported but unused `configureForces`/`buildSimLinks`).
- **`src/components/RadialMap.tsx`** — renders the hex field (`.hex-svg`:
  `.hex-cell` field + `.hex-node` framed cells), connectors (all `<path>`),
  nodes, rim labels, ghost, bubbles; wires drag + tooltips (tooltips ride the
  node via rAF).
- **`MapView.tsx`** (measures area, ResizeObserver debounced, owns tooltip,
  arrows, hint, renders `Legend`), **`Legend.tsx`** (domain colour key),
  **`Tooltip.tsx`**, **`DetailDrawer.tsx`** (rich knowledge panel — see above),
  **`CommandPalette.tsx`** (⌘K search), **`Dashboards.tsx`**,
  **`TopBar.tsx`**, **`App.tsx`** (view/focus/selection/palette state, global
  keys, hash deep-linking, related-node resolution for the drawer).
- **`src/index.css`** — space-theme CSS-variable tokens + all component styles.
  Background is pure `#000`. Tokens include `--text-2` (mid body copy). Hex
  styles + animations: `hexPulse` (cell shimmer), `traceFlow` (thread current);
  both disabled under `prefers-reduced-motion`.
- **`tailwind.config.js`** — palette **mirrors** the CSS variables (incl.
  `ink-2`). Keep both in sync when adding tokens.
- **`src/lib/icons.tsx`** — node id → lucide icon.

## Conventions

- All code/comments/UI strings in **English**.
- Content is **data-driven**: prefer editing `mapData.ts` over hardcoding in
  components.
- Keep the build green: `npm run build` (strict TS) must pass; no unused
  locals/params.
- When adding a colour token, edit **both** `index.css` (CSS var) and
  `tailwind.config.js`.

## Deploy

- `.github/workflows/deploy.yml` — GitHub Pages via Actions. Currently set to
  **manual (`workflow_dispatch`) only** because Pages can't publish a private
  repo on the free plan. To auto-deploy: make the repo public (or use GitHub
  Pro) and restore the `push:` trigger; or deploy the `dist/` (or the single
  `dist-standalone/index.html`) to any static host (Cloudflare Pages / Netlify /
  Vercel — these support private repos free).
- Vite `base` is relative (`./`), so it works from a project sub-path.

## Suggested next steps (not yet done)

- Extend the honeycomb/circuit language into the **focus view** and
  **Dashboards** so all three views match.
- Two-tap **touch** tooltip peek; spatial **roving-tabindex** keyboard nav
  between nodes; **zoom & pan**; a filter mode that dims non-matching nodes on
  the map itself (the ⌘K palette exists; map-level dimming does not).
- Surface `status`/`confidence` on Dashboards cards (currently drawer-only).
- Fully drop the unused `configureForces`/`buildSimLinks` exports and the
  `d3-force` dependency (only the `SimulationNodeDatum` type remains in use).
- Replace the placeholder contact email in `mapData.ts`
  (`hello@dogankaraca.com`) — it is marked `placeholder` in the UI until then.

## Previews

See `previews/` (`overview.png`, `honeycomb-square.png`, `focus-data.png`) for
the current look, and `dogan-knowledge-map.html` for a runnable single-file
build you can open in a browser.
