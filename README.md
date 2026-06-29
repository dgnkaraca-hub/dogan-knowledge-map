# Doğan Karaca — Knowledge Map

An interactive "second brain" portfolio. Instead of a grid of projects, the
practice is drawn as a living constellation: seven domains orbit a dense
central nucleus, and focusing a domain blooms its work into a fan-shaped tree.

Built with Vite + React + TypeScript + Tailwind + Framer Motion. All node
positions are eased every frame by a small imperative animation engine, so the
map drifts gently and re-arranges smoothly when you move between views.

---

## Run it

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build locally
```

Node 18+ is recommended.

---

## Deploy to GitHub Pages

This repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that
builds the site and publishes `dist/` to GitHub Pages on every push to `main`.

**One-time setup**

1. Create an empty GitHub repo (no README / .gitignore) and push this folder:

   ```bash
   git init
   git add -A
   git commit -m "Initial commit: Doğan Karaca Knowledge Map"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub
   Actions**.

Every push to `main` then rebuilds and redeploys automatically. The site is
served at `https://<you>.github.io/<repo>/` — the Vite `base` is relative
(`./`), so it works from that project sub-path.

### Single-file alternative

`npx vite build --config vite.config.singlefile.ts` bundles the whole app into
one self-contained `dist-standalone/index.html` you can open straight from disk
or drop onto any static host.

---

## The two views

**MAP — galaxy**
Seven domains sit around a wide ring with serif labels at the screen edges.
Each domain's leaves cluster just inside its label, and a decorative nucleus
glows at the center. Hovering a node shows a tooltip; clicking a domain focuses
it.

**MAP — focus**
The chosen domain becomes a large hub at the bottom center and its leaves fan
upward as a tree. The domain name rises behind the tree as a faint ghost
watermark, the other domains recede to dim edge labels, and `<` `>` arrows let
you move between domains. Click a leaf to open its detail panel. Press the
**Overview** button, click the background, or hit `Esc` to zoom back out.

**DASHBOARDS**
A structured, scannable reading of the same material — selected works, skills,
media, teaching, research, and contact — for visitors who prefer a document to
a map.

---

## Editing the content

All copy lives in one file:

```
src/data/mapData.ts
```

It is plain data with full TypeScript types. To change the map you only edit
this file:

- **`center`** — name, role line, and thesis sentence.
- **`domains[]`** — each domain has an `id`, `label`, `blurb`, and a list of
  **`children`**. Every child has an `id`, `label`, `type`, a short `tip`
  (shown in the hover tooltip and detail panel), an optional longer `desc`,
  optional `tags`, and optional `links` (each `{ label, url }`).
- **`selectedWorks`**, **`skillGroups`**, **`contact`** — drive the Dashboards
  view.

Add or remove children freely; the layout re-spaces itself around whatever
count you give it. Keep `id` values unique.

> The contact action uses a placeholder address (`hello@dogankaraca.com`).
> Replace it in `mapData.ts` before publishing.

### Icons

Each node's icon is chosen in:

```
src/lib/icons.tsx
```

Icons are keyed by node `id` (with a per-type fallback), using
[lucide-react](https://lucide.dev). To change an icon, map the node's `id` to a
different lucide icon there — no change to the content file needed.

---

## How it is put together

```
src/
  data/mapData.ts        the single source of content
  lib/
    layout.ts            pure geometry: galaxy ring + focus fan, ghost,
                         nucleus generation, line states (no DOM, no React)
    icons.tsx            node id  ->  lucide icon
  hooks/
    useRadialEngine.ts   requestAnimationFrame loop; eases every node toward
                         its target, adds ambient drift, draws the connector
                         lines, and paints node transforms straight onto the DOM
    usePrefersReducedMotion.ts
  components/
    TopBar.tsx           MAP / DASHBOARDS switch + Overview reset
    MapView.tsx          measures the area, owns the tooltip, renders arrows
    RadialMap.tsx        nucleus, lines, nodes, edge labels, ghost, hub label
    Tooltip.tsx          floating hover tooltip
    DetailDrawer.tsx     slide-in panel for a focused leaf
    Dashboards.tsx       the structured reading view
  App.tsx                view + focus + selection state
  index.css              design tokens and all component styles
```

### The idea behind the engine

`layout.ts` answers one question: *given the screen size and which domain is
focused, where should every node be?* It returns target coordinates plus small
flags (hidden / dim / active). It never touches the DOM.

`useRadialEngine.ts` then runs a `requestAnimationFrame` loop that nudges each
node a little closer to its target each frame and adds a slow sine-based drift,
so nothing ever snaps — it glides. When `prefers-reduced-motion` is set, the
drift is dropped and motion is near-instant.

Because content, geometry, and motion are separated, you can restyle the look
in `index.css`, re-shape the math in `layout.ts`, or rewrite the words in
`mapData.ts` without any of them interfering.

---

## Design tokens

Warm paper background, charcoal nodes, a single dusty-rose accent, and
Instrument Serif for display type. All values are CSS variables at the top of
`src/index.css`, so the whole palette and typography can be retuned in one
place.
