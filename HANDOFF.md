# HANDOFF — Doğan Karaca Knowledge Map (live network)

A self-contained brief for continuing this project in your own editor / coding
assistant. It explains the architecture, the data model, and — most importantly
— how the **live, draggable d3-force network** is built and tuned (space theme,
floating bubbles, grab-and-throw nodes), so you can extend it confidently.

> Conventions for this repo: **all code, comments, identifiers, and UI strings
> are in English.** Content is data-driven from one file; you should rarely need
> to touch components to change what the map shows.

---

## 1. What this is

An interactive portfolio drawn as a living knowledge graph on a dark "space"
canvas (space black / blue / gray), not a grid.

- **MAP / network view (default)** — a **live d3-force simulation**. Seven
  domains settle around a ring (serif labels pinned at the screen edges); their
  leaves float on links + repulsion into an organic cloud; cross-links
  ("threads") weave related ideas with fine curved edges; node size grows with
  connectivity. The whole web drifts gently like it is floating in space, and
  **any node can be grabbed, dragged, and thrown** — release it and the sim
  re-settles around it. Tiny **bubbles** drift through the space between nodes.
- **MAP / focus view** — click a domain: the sim pauses, that domain eases into
  a large hub at the bottom center, its leaves fan upward as a tree, its name
  rises as a ghost watermark, the other domains dim to edge labels, threads
  fade, and `<` `>` arrows step between domains. Leave focus and the sim reheats
  and carries on from wherever the nodes are.
- **DASHBOARDS view** — the same material as a structured, readable document.

---

## 2. Stack & scripts

Vite 5 · React 18 · TypeScript 5 (strict) · Tailwind 3 · Framer Motion 11 ·
lucide-react (icons) · **d3-force** (live simulation).

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build  -> dist/
npm run preview
```

---

## 3. File map

```
src/
  data/mapData.ts        SINGLE source of content (text + relations/threads)
  lib/
    layout.ts            pure geometry: graph build, shared force config,
                         frozen seed solve, focus/fan target math, sizes
    icons.tsx            node id -> lucide icon (with per-type fallback)
  hooks/
    useForceGraph.ts     LIVE draggable d3-force sim: rAF loop, drag controls,
                         draws straight tree <line>s and curved relation <path>s
    usePrefersReducedMotion.ts
  components/
    TopBar.tsx           MAP / DASHBOARDS switch + Overview reset
    MapView.tsx          measures area, owns tooltip, renders < > arrows
    RadialMap.tsx        solves the seed, runs the sim hook, renders nodes /
                         edges / labels / ghost / bubbles; wires drag + sizes
    Tooltip.tsx          floating hover tooltip
    DetailDrawer.tsx     slide-in panel for a focused leaf
    Dashboards.tsx       structured reading view
  App.tsx                view + focus + selection state, Esc handling
  index.css              space-theme design tokens + all component styles
```

Separation: **content** (`mapData.ts`), **geometry + forces** (`layout.ts`),
**motion + drag** (`useForceGraph.ts`), **style** (`index.css`).

---

## 4. Data model (`src/data/mapData.ts`)

```ts
center: { name, role, thesis }
domains: Domain[]                       // 7 domains
  Domain = { id, label, blurb, children: ChildNode[] }
  ChildNode = { id, label, type, tip, desc?, tags?, links? }
relations: { from, to }[]               // the "threads" (cross-links)
selectedWorks, skillGroups, contact     // Dashboards view
```

- Every `id` must be unique.
- `relations` connect any two node ids (usually leaf-to-leaf across domains).
  These are what turn the tree into a web: the sim pulls connected ideas toward
  each other and draws a curved thread between them. Add/remove pairs to knit
  the graph tighter or looser. There are 27 today.
- `links[]` are `{ label, url }`. The contact action uses a **placeholder**
  `hello@dogankaraca.com` — replace before publishing.

Icons are keyed by node id in `src/lib/icons.tsx`; change an icon there.

---

## 5. How the live network works (the important part)

### 5a. Graph — `buildGraph(data)`
Produces nodes (`center`, domains, leaves) and lines: `spoke` (center→domain,
structural), `branch` (domain→leaf), `relation` (leaf↔leaf threads, each with a
signed `curve` for its bow).

### 5b. Shared forces — `layout.ts`
`buildSimNodes`, `buildSimLinks`, and `configureForces` define the physics, used
by BOTH the one-shot seed solve and the live sim so they feel identical.

| Force | Setting | Effect |
|---|---|---|
| `forceLink` distance | branch `72`, relation `150` | thread length / tightness |
| `forceLink` strength | branch `0.5`, relation `0.08` | how rigidly links pull |
| `forceManyBody` | `-95` | overall repulsion / spread |
| `forceCollide` | radius `20` | minimum node spacing |
| `forceX/forceY` anchor strength | center `1` (pinned), domain `0.55`, child `0.06` | domains hold the ring; leaves float free |
| ring radii | `rx = min(w*0.4, w/2-150)`, `ry = min(h*0.4, h/2-96)` | how far domains sit from center |

`computeNetwork` builds these, ticks 360 times to rest, and returns settled
positions (it **seeds** the live sim so the graph opens calm instead of
exploding; it is also what the geometry test checks).

### 5c. Live simulation + drag — `useForceGraph.ts`
One rAF loop drives everything:
- **Network view:** `sim.tick()` every frame, kept gently warm so the web
  drifts. Non-dragged nodes are clamped to the viewport. Liveliness/feel knobs:
  `velocityDecay 0.9`, `alphaDecay 0.02`, **`alphaTarget 0.012`** (the floor that
  keeps it alive — raise for more constant motion, set to `0` to let it settle),
  `alpha 0.7` on (re)build.
- **Focus view:** the sim is not ticked; nodes ease toward the fan-tree targets
  from `computeTargets`. Returning to the network reheats the sim.
- **Drag controls** returned by the hook: `startDrag(id,x,y)` pins a node
  (`fx/fy`) — no alpha jolt; `moveDrag(x,y)` follows the pointer and heats alpha
  to `0.3`; `endDrag()` releases (`fx/fy=null`) and reheats to `0.35` so the web
  re-settles. The center node is always pinned. Dragging is enabled only in the
  network view.

`RadialMap` wires pointers: `onPointerDown` on a node calls `startDrag` and adds
window `pointermove`/`pointerup` listeners; a 3px movement threshold (`movedRef`)
suppresses the click so a drag never opens the drawer. Coordinates are converted
to the map layer's local space via `layerRef.getBoundingClientRect()`.

### 5d. Bubbles
`makeBubbles(46)` in `RadialMap` seeds drifting particles (position, size
`1.5–6px`, duration `9–23s`, drift vector via CSS vars `--dx/--dy`). They animate
purely in CSS (`@keyframes bubbleFloat`, fade in/out, ~0.45 opacity) for zero JS
cost, and are hidden under reduced-motion. Tune count in `makeBubbles(n)` and
speed/spread in its random ranges; tune look in `.bubble` in `index.css`.

### 5e. Sizes & threads
Node diameter in the network view comes from degree (`sizeForDegree`: domain
`30 + 3·√(deg−1)`, leaf `22 + 6·√(deg−1)`), applied inline; in focus, size is `0`
so CSS classes size the hub/leaves. Thread curvature is set in `buildGraph`;
thread opacity is `.36` in CSS.

---

## 6. Design tokens — space theme (`src/index.css` + `tailwind.config.js`)

CSS variables drive everything (the Tailwind palette mirrors them, keep both in
sync): `--bg #070a12` (space black), `--bg-2 #0b1020`, `--panel #0e1424`,
`--panel-2 #121a2e`, `--text #e7ecf7`, `--muted #8b96ad` (space gray),
`--line #2a3650`, `--node #0f1830`, `--node-2 #14203c`, `--node-border #38476e`,
**`--accent #5b8cff` (space blue)**, `--glow rgba(91,140,255,.55)`. Body is a
radial space-depth gradient. Retune the whole look in one place.

---

## 7. Suggested next steps

- **Color or weight threads by domain** (tint a relation by its source domain)
  to read clusters at a glance.
- **Zoom / pan** the map layer (wrap in a transformed group; pointer + wheel).
- **Pin toggle**: double-click to keep a dragged node fixed (`fx/fy` retained).
- **Bubbles along threads**: send a few particles travelling each relation curve
  instead of (or with) the ambient drift.
- **Search / filter**: dim everything except matches and their threads.
- **Deep-linking**: read/write `#focus=<domainId>` in the URL hash.
- **Mobile layout**: tighten ring radii / label sizes under ~640px; the sim and
  drag already work with touch (`touch-action: none` is set on nodes).
- Replace the placeholder contact email.

---

## 8. Environment note

This repo is environment-agnostic — no machine paths or tokens are committed.
When you wire up deploy / CI, keep your Mac and Windows contexts separate
(different GitHub usernames, tokens only in `.env`, never commit `.env`).

---

## 9. Paste-ready prompt for your coding assistant

Copy the block below into your assistant alongside the repo, then add your task.

```
You are working in the "Doğan Karaca Knowledge Map" repo (Vite + React + TS +
Tailwind + Framer Motion + d3-force). Conventions:
- All code, comments, identifiers, and UI strings in English.
- Content is data-driven: edit src/data/mapData.ts (domains, children,
  relations) rather than hardcoding into components.
- Geometry + force config live in src/lib/layout.ts. The LIVE, draggable
  simulation lives in src/hooks/useForceGraph.ts (rAF loop, drag controls,
  straight <line> tree edges, curved <path> relation threads). Styles and the
  space-theme design tokens live in src/index.css (Tailwind palette mirrors the
  CSS variables — keep both in sync).
- The MAP has two states: a live d3-force network (focus = null, nodes
  draggable) and a bottom-center fan-tree focus (focus = a domain id).
  DASHBOARDS is a separate structured view.
- Keep the build green: `npm run build` (strict TS) must pass.

Task: <describe what you want next — e.g. "tint each relation thread by its
source domain and add a small legend">.
Explain your plan briefly, then implement it with minimal, well-commented diffs.
```
