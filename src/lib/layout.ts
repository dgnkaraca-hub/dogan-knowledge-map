/* ============================================================
   layout.ts
   ------------------------------------------------------------
   Pure geometry for the map. Two states:

   NETWORK (focus = null)
     The whole practice as a force-directed web. Seven domains
     settle around a wide ring (their serif labels pinned at the
     edges); their leaves float on links and repulsion into an
     organic cloud; and a set of cross-links ("threads") weaves
     related ideas together. Node size grows with connectivity.
     The result reads like a Gephi graph.

   FOCUS (focus = domainId)
     One domain becomes a large hub at the bottom center and its
     leaves fan upward as a tree. The domain name rises behind the
     tree as a ghost watermark; the other domains recede to faint
     edge labels and the threads fade out.

   This module never touches React or the DOM. The animation
   engine eases nodes toward whatever targets these functions
   return; the force solve (computeNetwork) is run once per size
   by the component and handed back in.
   ============================================================ */

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import type { MapData } from "../data/mapData";

export type NodeKind = "center" | "domain" | "child";

export interface GraphNode {
  id: string;
  kind: NodeKind;
  domainId: string | null;
  label: string;
}

export interface GraphLine {
  id: string;
  kind: "spoke" | "branch" | "relation";
  fromId: string;
  toId: string;
  /** Signed curvature for relation threads (0 for straight edges). */
  curve: number;
  /** Stroke for relation threads, tinted by the source domain (undefined = CSS default). */
  color?: string;
}

export interface Graph {
  nodes: GraphNode[];
  lines: GraphLine[];
}

export interface Area {
  w: number;
  h: number;
  cx: number;
  cy: number;
  rd: number;
}

export interface NodeTarget {
  tx: number;
  ty: number;
  hidden: boolean;
  dim: boolean;
  /** Disc diameter in px. 0 means "let CSS decide" (used in focus). */
  size: number;
  /** Fan-tree stagger index (leaf order within a focused domain); 0 = first. */
  order?: number;
}

export type LabelAlign = "left" | "right" | "center";

export interface DomainLabelInfo {
  x: number;
  y: number;
  align: LabelAlign;
  dim: boolean;
  hidden: boolean;
}

export interface LineState {
  dim: boolean;
  active: boolean;
  on: boolean;
}

export interface NetworkLayout {
  pos: Map<string, { x: number; y: number }>;
  degree: Map<string, number>;
}

export interface LayoutResult {
  targets: Record<string, NodeTarget>;
  domainLabels: Record<string, DomainLabelInfo>;
  lineStates: Record<string, LineState>;
  ghost: { label: string; show: boolean };
  hub: { x: number; y: number } | null;
}

const TAU = Math.PI * 2;
const SQRT3 = Math.sqrt(3);

/** Build the graph: center + domains + leaves, tree edges + relation threads. */
export function buildGraph(data: MapData): Graph {
  const nodes: GraphNode[] = [
    { id: "center", kind: "center", domainId: null, label: data.center.name },
  ];
  const lines: GraphLine[] = [];
  const domainColor = new Map<string, string>();

  data.domains.forEach((d) => {
    domainColor.set(d.id, d.color);
    nodes.push({ id: d.id, kind: "domain", domainId: d.id, label: d.label });
    lines.push({ id: `spoke-${d.id}`, kind: "spoke", fromId: "center", toId: d.id, curve: 0 });
    d.children.forEach((c) => {
      nodes.push({ id: c.id, kind: "child", domainId: d.id, label: c.label });
      lines.push({ id: `branch-${c.id}`, kind: "branch", fromId: d.id, toId: c.id, curve: 0 });
    });
  });

  // Relation threads run straight across the lattice (curve 0) for the clean,
  // geometric honeycomb read; each is tinted by its source domain.
  const domainOf = new Map<string, string | null>(nodes.map((n) => [n.id, n.domainId]));
  data.relations.forEach((r) => {
    if (!domainOf.has(r.from) || !domainOf.has(r.to)) return;
    const srcDomain = domainOf.get(r.from);
    lines.push({
      id: `rel-${r.from}--${r.to}`,
      kind: "relation",
      fromId: r.from,
      toId: r.to,
      curve: 0,
      color: (srcDomain && domainColor.get(srcDomain)) || undefined,
    });
  });

  return { nodes, lines };
}

export function computeArea(width: number, height: number): Area {
  const cx = width / 2;
  const cy = height / 2;
  const rd = Math.max(150, Math.min(width / 2 - 96, height / 2 - 96, 320));
  return { w: width, h: height, cx, cy, rd };
}

/** A small seeded PRNG so the network solve is stable between renders. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Angle for domain i, evenly spaced with index 0 at the bottom. */
function galaxyAngle(i: number, n: number): number {
  return Math.PI / 2 + (i * TAU) / n;
}

function ringRadii(area: Area) {
  // Proportional margins (clamped to the old desktop values) so the ring keeps
  // its spread on phones instead of collapsing onto the vertical axis.
  const marginX = Math.min(150, Math.max(36, area.w * 0.12));
  const marginY = Math.min(96, Math.max(36, area.h * 0.12));
  return {
    rx: Math.min(area.w * 0.4, area.w / 2 - marginX),
    ry: Math.min(area.h * 0.4, area.h / 2 - marginY),
  };
}

/**
 * Concentric geometry for the symmetric "mandala" layout. Everything sits on
 * shared circles so the map reads as an ordered, crop-circle-like design:
 *   center · domains ring · leaves ring · domain labels at the rim.
 * A single circular radius (min dimension) keeps it a true circle, not an
 * ellipse, so the symmetry holds on any aspect ratio.
 */
export function geometryRadii(area: Area) {
  const base = Math.min(area.w, area.h) / 2;
  const margin = Math.max(54, base * 0.14);
  const maxR = Math.max(120, base - margin);
  return {
    maxR,
    rDomain: maxR * 0.4,
    rLeaf: maxR * 0.72,
    rLabel: maxR * 0.99,
  };
}

/* ============================================================
   HEX HONEYCOMB GEOMETRY (pointy-top, axial coordinates)
   The network view is a hexagonal lattice: nodes snap to hex
   cells and a faint honeycomb field fills the field behind them.
   ============================================================ */

const HEX_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

/** Hex circumradius for the current area. */
export function hexSize(area: Area): number {
  return Math.max(26, geometryRadii(area).maxR / 8);
}

/** Axial (q,r) hex cell -> pixel center. */
export function axialToPixel(q: number, r: number, s: number, cx: number, cy: number) {
  return { x: cx + s * SQRT3 * (q + r / 2), y: cy + s * 1.5 * r };
}

/** Round fractional cube coords to the nearest hex cell. */
function axialRound(qf: number, rf: number): [number, number] {
  const x = qf;
  const z = rf;
  const y = -x - z;
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return [rx, rz];
}

/** Pixel point -> nearest hex cell (axial). */
function pixelToAxial(px: number, py: number, s: number, cx: number, cy: number): [number, number] {
  const x = px - cx;
  const y = py - cy;
  const qf = ((SQRT3 / 3) * x - y / 3) / s;
  const rf = ((2 / 3) * y) / s;
  return axialRound(qf, rf);
}

/** SVG path for a pointy-top hexagon centered at (x,y) with circumradius s. */
export function hexPath(x: number, y: number, s: number): string {
  let d = "";
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    d += `${i ? "L" : "M"}${(x + s * Math.cos(a)).toFixed(1)} ${(y + s * Math.sin(a)).toFixed(1)} `;
  }
  return d + "Z";
}

/** Every hex-cell center whose hexagon touches the area (the honeycomb field). */
export function honeycombCells(area: Area, s: number): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = [];
  const reach = Math.ceil(Math.max(area.w, area.h) / (s * 1.5)) + 2;
  for (let r = -reach; r <= reach; r++) {
    for (let q = -reach; q <= reach; q++) {
      const p = axialToPixel(q, r, s, area.cx, area.cy);
      if (p.x > -s && p.x < area.w + s && p.y > -s && p.y < area.h + s) cells.push(p);
    }
  }
  return cells;
}

/** Unit vectors along the six hex axes (0/60/120/180/240/300 degrees). */
const HEX_UNIT: ReadonlyArray<readonly [number, number]> = [0, 60, 120, 180, 240, 300].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a)] as const;
});

/**
 * Route A->B as two straight segments along hex axes (multiples of 60°), so the
 * connectors read like circuit traces on the lattice. The two axes bracketing
 * the A->B direction are chosen, so both legs head toward B (no backtracking).
 */
export function hexElbowPath(ax: number, ay: number, bx: number, by: number): string {
  const dx = bx - ax;
  const dy = by - ay;
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return `M${ax.toFixed(1)} ${ay.toFixed(1)}`;
  let ang = Math.atan2(dy, dx);
  if (ang < 0) ang += TAU;
  const i = Math.floor(ang / (Math.PI / 3)) % 6;
  const u = HEX_UNIT[i];
  const w = HEX_UNIT[(i + 1) % 6];
  const det = u[0] * w[1] - w[0] * u[1];
  const a = (dx * w[1] - w[0] * dy) / det; // length along the first axis
  const px = ax + a * u[0];
  const py = ay + a * u[1];
  return `M${ax.toFixed(1)} ${ay.toFixed(1)} L${px.toFixed(1)} ${py.toFixed(1)} L${bx.toFixed(1)} ${by.toFixed(1)}`;
}

/** Degree of every node across tree edges + relation threads. */
export function computeDegrees(graph: Graph): Map<string, number> {
  const deg = new Map<string, number>();
  graph.nodes.forEach((n) => deg.set(n.id, 0));
  graph.lines.forEach((l) => {
    deg.set(l.fromId, (deg.get(l.fromId) ?? 0) + 1);
    deg.set(l.toId, (deg.get(l.toId) ?? 0) + 1);
  });
  return deg;
}

export interface SimNode extends SimulationNodeDatum {
  id: string;
  kind: NodeKind;
  domainId: string | null;
  gx: number; // ring/anchor target x
  gy: number; // ring/anchor target y
  anchor: number; // how strongly this node is pulled to its anchor
}

export interface SimLink {
  source: string;
  target: string;
  kind: "branch" | "relation";
}

/** Anchor point each node is pulled toward (domains -> ring, center -> middle). */
function anchorsFor(data: MapData, area: Area): Map<string, { x: number; y: number }> {
  const { rx, ry } = ringRadii(area);
  const n = data.domains.length;
  const anchorOf = new Map<string, { x: number; y: number }>();
  anchorOf.set("center", { x: area.cx, y: area.cy });
  data.domains.forEach((d, i) => {
    const ang = galaxyAngle(i, n);
    anchorOf.set(d.id, { x: area.cx + rx * Math.cos(ang), y: area.cy + ry * Math.sin(ang) });
  });
  return anchorOf;
}

/**
 * Build the simulation nodes. When `seed` is given (a previous solve), nodes
 * start from those positions so the live graph opens already settled instead
 * of exploding outward on first paint.
 */
export function buildSimNodes(
  data: MapData,
  area: Area,
  graph: Graph,
  seed?: Map<string, { x: number; y: number }>,
): SimNode[] {
  const anchorOf = anchorsFor(data, area);
  const rnd = mulberry32(20260629);
  return graph.nodes.map((nd) => {
    let anchor: { x: number; y: number };
    let strength: number;
    if (nd.kind === "center") {
      anchor = anchorOf.get("center")!;
      strength = 1;
    } else if (nd.kind === "domain") {
      anchor = anchorOf.get(nd.id)!;
      strength = 0.55;
    } else {
      anchor = anchorOf.get(nd.domainId!) ?? { x: area.cx, y: area.cy };
      strength = 0.06;
    }
    const s = seed?.get(nd.id);
    const jitter = nd.kind === "child" ? 70 : 6;
    return {
      id: nd.id,
      kind: nd.kind,
      domainId: nd.domainId,
      gx: anchor.x,
      gy: anchor.y,
      anchor: strength,
      x: s ? s.x : anchor.x + (rnd() - 0.5) * jitter,
      y: s ? s.y : anchor.y + (rnd() - 0.5) * jitter,
      fx: nd.kind === "center" ? area.cx : undefined,
      fy: nd.kind === "center" ? area.cy : undefined,
    };
  });
}

/** Branch + relation links drive the layout; spokes are structural only. */
export function buildSimLinks(graph: Graph): SimLink[] {
  return graph.lines
    .filter((l) => l.kind !== "spoke")
    .map((l) => ({ source: l.fromId, target: l.toId, kind: l.kind as "branch" | "relation" }));
}

/**
 * Apply the shared force configuration. Used both for the one-shot solve
 * (computeNetwork) and the live, draggable simulation (useForceGraph), so the
 * frozen seed and the live graph feel like the same physics.
 */
export function configureForces(
  sim: ReturnType<typeof forceSimulation<SimNode>>,
  simLinks: SimLink[],
): ReturnType<typeof forceSimulation<SimNode>> {
  return sim
    .force(
      "link",
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance((l) => (l.kind === "relation" ? 150 : 72))
        .strength((l) => (l.kind === "relation" ? 0.08 : 0.5)),
    )
    .force("charge", forceManyBody<SimNode>().strength(-95))
    .force("collide", forceCollide<SimNode>().radius(20).strength(0.9))
    .force("x", forceX<SimNode>((d) => d.gx).strength((d) => d.anchor))
    .force("y", forceY<SimNode>((d) => d.gy).strength((d) => d.anchor));
}

/** Clamp a node inside the viewport with a small margin. */
export function clampToArea(x: number, y: number, area: Area): { x: number; y: number } {
  return {
    x: Math.max(34, Math.min(area.w - 34, x)),
    y: Math.max(34, Math.min(area.h - 50, y)),
  };
}

/**
 * Snap every node onto the hexagonal lattice: center cell at the middle, the 7
 * domains on hex cells around an inner radius, and each domain's leaves on hex
 * cells fanned across the outer field. A claim() helper keeps two nodes from
 * landing on the same cell. Pure geometry, no force solve — the live engine
 * eases nodes to these cells and springs a dragged node back to its cell.
 */
export function computeNetwork(data: MapData, area: Area, graph: Graph): NetworkLayout {
  const degree = computeDegrees(graph);
  const pos = new Map<string, { x: number; y: number }>();
  const n = data.domains.length;
  const { maxR } = geometryRadii(area);
  const s = hexSize(area);

  const used = new Set<string>();
  const keyOf = (q: number, r: number) => `${q},${r}`;
  // Claim a cell; if taken, step outward along the hex axes to the first free one.
  const claim = (q: number, r: number): { x: number; y: number } => {
    let cq = q;
    let cr = r;
    if (used.has(keyOf(cq, cr))) {
      outer: for (let radius = 1; radius < 8; radius++) {
        for (const [dq, dr] of HEX_NEIGHBORS) {
          const nq = q + dq * radius;
          const nr = r + dr * radius;
          if (!used.has(keyOf(nq, nr))) {
            cq = nq;
            cr = nr;
            break outer;
          }
        }
      }
    }
    used.add(keyOf(cq, cr));
    return axialToPixel(cq, cr, s, area.cx, area.cy);
  };
  const snap = (px: number, py: number) => {
    const [q, r] = pixelToAxial(px, py, s, area.cx, area.cy);
    return claim(q, r);
  };

  pos.set("center", snap(area.cx, area.cy));
  const Rd = maxR * 0.5; // domain ring radius
  const Rl = maxR * 0.8; // leaf field radius
  data.domains.forEach((d, i) => {
    const ang = galaxyAngle(i, n);
    pos.set(d.id, snap(area.cx + Rd * Math.cos(ang), area.cy + Rd * Math.sin(ang)));

    const k = d.children.length;
    const spread = (TAU / n) * 0.82;
    d.children.forEach((c, j) => {
      const off = k > 1 ? (j - (k - 1) / 2) * (spread / (k - 1)) : 0;
      const a = ang + off;
      pos.set(c.id, snap(area.cx + Rl * Math.cos(a), area.cy + Rl * Math.sin(a)));
    });
  });

  return { pos, degree };
}

function alignFor(cosA: number): LabelAlign {
  if (cosA > 0.35) return "left";
  if (cosA < -0.35) return "right";
  return "center";
}

/**
 * Disc diameter for a node in the network view, based on its degree. Tunable
 * here: every leaf has exactly one branch edge, so (degree - 1) is its number
 * of relation threads — the leaf gain is widened so well-connected ideas
 * clearly bloom instead of all reading the same size.
 */
const SIZE = {
  domainBase: 32,
  domainGain: 4,
  leafBase: 20,
  leafGain: 9,
};
function sizeForDegree(kind: NodeKind, degree: number): number {
  const d = Math.sqrt(Math.max(degree - 1, 0));
  if (kind === "domain") return Math.round(SIZE.domainBase + SIZE.domainGain * d);
  return Math.round(SIZE.leafBase + SIZE.leafGain * d);
}

export function computeTargets(
  data: MapData,
  area: Area,
  focus: string | null,
  reduceMotion: boolean,
  network: NetworkLayout,
): LayoutResult {
  void reduceMotion;
  const n = data.domains.length;
  const targets: Record<string, NodeTarget> = {};
  const domainLabels: Record<string, DomainLabelInfo> = {};
  const lineStates: Record<string, LineState> = {};

  const focused = !!focus;
  const { rx, ry } = ringRadii(area);
  const geo = geometryRadii(area);

  targets.center = { tx: area.cx, ty: area.cy, hidden: false, dim: focused, size: 0 };

  const focusIndex = focus ? data.domains.findIndex((d) => d.id === focus) : -1;

  data.domains.forEach((d, i) => {
    const ang = galaxyAngle(i, n);
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);
    const isActive = focus === d.id;

    // Edge-label anchor — at the mandala rim, on the same circle in both states.
    const labelAnchor = {
      x: area.cx + geo.rLabel * cosA,
      y: area.cy + geo.rLabel * sinA,
      align: alignFor(cosA),
    };

    if (!focused) {
      // NETWORK: positions come from the force solve; sizes from degree.
      const dp = network.pos.get(d.id) ?? { x: area.cx + rx * cosA, y: area.cy + ry * sinA };
      targets[d.id] = {
        tx: dp.x,
        ty: dp.y,
        hidden: false,
        dim: false,
        size: sizeForDegree("domain", network.degree.get(d.id) ?? 1),
      };
      domainLabels[d.id] = { ...labelAnchor, dim: false, hidden: false };

      d.children.forEach((c) => {
        const cp = network.pos.get(c.id) ?? dp;
        targets[c.id] = {
          tx: cp.x,
          ty: cp.y,
          hidden: false,
          dim: false,
          size: sizeForDegree("child", network.degree.get(c.id) ?? 1),
        };
        lineStates[`branch-${c.id}`] = { dim: true, active: false, on: true };
      });
      // Spokes radiate from the center — in the mandala they read as structure.
      lineStates[`spoke-${d.id}`] = { dim: false, active: false, on: false };
    } else if (isActive) {
      // FOCUS: this domain becomes the bottom-center hub; leaves fan upward.
      const hx = area.cx;
      const hy = area.h * 0.82;
      targets[d.id] = { tx: hx, ty: hy, hidden: false, dim: false, size: 0 };
      domainLabels[d.id] = { ...labelAnchor, dim: false, hidden: true };

      const kids = d.children;
      const kn = kids.length;
      const up = -Math.PI / 2;
      const spread = Math.min(2.5, 0.5 + 0.28 * kn);
      const baseR = Math.max(150, Math.min(Math.min(area.w, area.h) * 0.3, 250));
      kids.forEach((c, ci) => {
        const off = kn > 1 ? (ci - (kn - 1) / 2) * (spread / (kn - 1)) : 0;
        const a = up + off;
        const r = baseR + (ci % 2 === 0 ? 0 : 44);
        targets[c.id] = {
          tx: hx + r * Math.cos(a),
          ty: hy + r * Math.sin(a),
          hidden: false,
          dim: false,
          size: 0,
          order: ci,
        };
        lineStates[`branch-${c.id}`] = { dim: false, active: true, on: true };
      });
      lineStates[`spoke-${d.id}`] = { dim: false, active: false, on: false };
    } else {
      // FOCUS: other domains recede to faint edge labels; leaves hidden.
      const dp = network.pos.get(d.id) ?? { x: area.cx + rx * cosA, y: area.cy + ry * sinA };
      targets[d.id] = { tx: dp.x, ty: dp.y, hidden: true, dim: true, size: 0 };
      domainLabels[d.id] = { ...labelAnchor, dim: true, hidden: false };
      d.children.forEach((c) => {
        targets[c.id] = { tx: dp.x, ty: dp.y, hidden: true, dim: true, size: 0 };
        lineStates[`branch-${c.id}`] = { dim: false, active: false, on: false };
      });
      lineStates[`spoke-${d.id}`] = { dim: false, active: false, on: false };
    }
  });

  // Relation threads: visible (and curved) in the network view, faded in focus.
  data.relations.forEach((r) => {
    lineStates[`rel-${r.from}--${r.to}`] = {
      dim: false,
      active: false,
      on: !focused,
    };
  });

  const activeDomain = focusIndex >= 0 ? data.domains[focusIndex] : null;

  return {
    targets,
    domainLabels,
    lineStates,
    ghost: { label: activeDomain ? activeDomain.label : "", show: focused },
    hub: activeDomain ? { x: area.cx, y: area.h * 0.82 } : null,
  };
}
