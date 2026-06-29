/* ============================================================
   useForceGraph.ts
   ------------------------------------------------------------
   A live, draggable d3-force simulation that drives the network
   view. React owns the *state* (focus, area); this hook owns the
   *motion*.

   - In the network view (focus = null) the simulation ticks every
     frame, kept gently warm so the web drifts like it is floating
     in space, and nodes can be grabbed and thrown around.
   - In the focus view the simulation is paused and nodes ease
     toward the fan-tree targets instead; on return to the network
     the sim reheats and carries on from wherever things landed.

   Positions are written straight to the DOM (node transforms, line
   endpoints, thread paths) so the graph never re-renders per frame.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import { forceSimulation, forceManyBody } from "d3-force";
import {
  buildSimLinks,
  buildSimNodes,
  clampToArea,
  configureForces,
  hexElbowPath,
  type Area,
  type Graph,
  type NetworkLayout,
  type NodeTarget,
  type SimNode,
} from "../lib/layout";

export interface ForceGraphRefs {
  nodeEls: Map<string, HTMLElement>;
  lineEls: Map<string, SVGLineElement>;
  pathEls: Map<string, SVGPathElement>;
  centerEl: { current: HTMLElement | null };
}

interface UseForceGraphArgs {
  data: import("../data/mapData").MapData;
  graph: Graph;
  area: Area;
  /** Frozen solve used to seed the live sim so it opens settled. */
  network: NetworkLayout;
  /** Fan-tree targets, read every frame while focused. */
  targetsRef: { current: Record<string, NodeTarget> };
  focus: string | null;
  reduceMotion: boolean;
  active: boolean;
  refs: ForceGraphRefs;
}

export interface ForceGraphControls {
  startDrag: (id: string, x: number, y: number) => void;
  moveDrag: (x: number, y: number) => void;
  endDrag: () => void;
  draggingId: string | null;
}

export function useForceGraph({
  data,
  graph,
  area,
  network,
  targetsRef,
  focus,
  reduceMotion,
  active,
  refs,
}: UseForceGraphArgs): ForceGraphControls {
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);
  const nodesRef = useRef<Map<string, SimNode>>(new Map());
  const draggingRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const focusRef = useRef<string | null>(focus);
  const rafRef = useRef<number | null>(null);
  // Timestamp the moment focus opens, so leaves can unfurl staggered.
  const focusStartRef = useRef<number>(0);
  // rAF handle for the charge "breathe-out" ramp when leaving focus.
  const chargeRafRef = useRef<number | null>(null);

  // Build (or rebuild) the simulation when the graph or the size changes.
  useEffect(() => {
    if (area.w === 0 || area.h === 0) return;
    const seed = network.pos.size > 0 ? network.pos : undefined;
    const nodes = buildSimNodes(data, area, graph, seed);
    const links = buildSimLinks(graph);
    const sim = configureForces(forceSimulation(nodes).stop(), links);
    sim.velocityDecay(0.9).alphaDecay(0.02).alphaMin(0).alphaTarget(0.012).alpha(0.7);
    simRef.current = sim;
    const m = new Map<string, SimNode>();
    nodes.forEach((n) => m.set(n.id, n));
    nodesRef.current = m;
    // `network` is itself a pure function of (data, graph, area.w, area.h), so
    // it is omitted here to avoid a redundant second rebuild on every resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, area.w, area.h]);

  // Track focus; reheat the sim when returning to the network view.
  useEffect(() => {
    focusRef.current = focus;
    const sim = simRef.current;
    const now = typeof performance !== "undefined" ? performance.now() : 0;
    if (!sim) return;

    if (focus) {
      // Opening focus: stamp the fan clock and cancel any in-flight breathe-out.
      focusStartRef.current = now;
      if (chargeRafRef.current !== null) {
        cancelAnimationFrame(chargeRafRef.current);
        chargeRafRef.current = null;
      }
      return;
    }

    // Leaving focus: the leaves are packed tightly at the bottom hub. Full
    // repulsion (-95) would explode them apart in one jolt, so ramp the charge
    // from soft to full over ~420ms and reheat with a modest alpha — the cloud
    // breathes back out instead of popping.
    const charge = sim.force("charge") as ReturnType<typeof forceManyBody<SimNode>> | undefined;
    if (charge) {
      const FROM = -40;
      const TO = -95;
      const DUR = 420;
      const ramp = (ts: number) => {
        const p = Math.min(1, (ts - now) / DUR);
        charge.strength(FROM + (TO - FROM) * p);
        if (p < 1) chargeRafRef.current = requestAnimationFrame(ramp);
        else chargeRafRef.current = null;
      };
      chargeRafRef.current = requestAnimationFrame(ramp);
    }
    sim.alpha(Math.max(sim.alpha(), 0.32));

    return () => {
      if (chargeRafRef.current !== null) {
        cancelAnimationFrame(chargeRafRef.current);
        chargeRafRef.current = null;
      }
    };
  }, [focus]);

  // The single animation loop.
  useEffect(() => {
    if (!active) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    // Per-frame easing baseline (the feel knob), normalized below so the
    // tree converges at the same rate on 60Hz and 120Hz displays.
    const easeBase = 0.14;
    let lastTs = 0;

    const frame = (now: number) => {
      // Clamp dt so a backgrounded tab resuming doesn't produce a huge jump
      // (k would just saturate to ~1 and snap, which is fine).
      const dt = Math.min(50, lastTs ? now - lastTs : 16.67);
      lastTs = now;
      const k = reduceMotion ? 1 : 1 - Math.pow(1 - easeBase, dt / 16.67);

      const nodes = nodesRef.current;
      const targets = targetsRef.current;
      if (nodes.size) {
        const focused = focusRef.current;
        const elapsed = now - focusStartRef.current;
        // Both states ease toward their targets — the symmetric mandala in the
        // network view, the fan tree in focus. With no force tick the network
        // stays perfectly symmetric, and a dragged node springs back home on
        // release. Snap within 0.3px so the lerp arrives instead of coasting.
        nodes.forEach((n) => {
          if (n.id === draggingRef.current) return;
          const t = targets[n.id];
          if (!t) return;
          if (focused && !reduceMotion) {
            const delay = (t.order ?? 0) * 28; // stagger the focus fan only
            if (elapsed < delay) return;
          }
          const nx = (n.x ?? area.cx) + (t.tx - (n.x ?? area.cx)) * k;
          const ny = (n.y ?? area.cy) + (t.ty - (n.y ?? area.cy)) * k;
          n.x = Math.abs(t.tx - nx) < 0.3 ? t.tx : nx;
          n.y = Math.abs(t.ty - ny) < 0.3 ? t.ty : ny;
        });

        nodes.forEach((n) => {
          const el = refs.nodeEls.get(n.id);
          if (el) el.style.transform = `translate(${n.x}px, ${n.y}px)`;
        });
        const center = nodes.get("center");
        if (center && refs.centerEl.current) {
          refs.centerEl.current.style.transform = `translate(${center.x}px, ${center.y}px)`;
        }

        graph.lines.forEach((l) => {
          const a = nodes.get(l.fromId);
          const b = nodes.get(l.toId);
          if (!a || !b) return;
          const ax = a.x ?? 0;
          const ay = a.y ?? 0;
          const bx = b.x ?? 0;
          const by = b.y ?? 0;
          const path = refs.pathEls.get(l.id);
          if (!path) return;
          // Hex-aligned elbow traces in the honeycomb view; straight in focus.
          path.setAttribute(
            "d",
            focused
              ? `M${ax.toFixed(1)} ${ay.toFixed(1)} L${bx.toFixed(1)} ${by.toFixed(1)}`
              : hexElbowPath(ax, ay, bx, by),
          );
        });
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    const start = () => {
      if (rafRef.current === null) {
        lastTs = 0; // reset the dt baseline so resuming doesn't jump
        rafRef.current = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // Pause the whole loop in a backgrounded tab — it costs nothing off-screen
    // and resumes seamlessly (lastTs reset avoids a dt spike).
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) start();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduceMotion, graph, area.w, area.h]);

  const startDrag = useCallback(
    (id: string, x: number, y: number) => {
      if (focusRef.current) return; // dragging only in the network view
      const n = nodesRef.current.get(id);
      if (!n) return;
      const c = clampToArea(x, y, area);
      n.fx = c.x;
      n.fy = c.y;
      n.x = c.x;
      n.y = c.y;
      draggingRef.current = id;
      setDraggingId(id);
      // Heat is applied on actual movement (moveDrag), so a plain click that
      // happens to start a drag does not jolt the whole graph.
    },
    [area],
  );

  const moveDrag = useCallback(
    (x: number, y: number) => {
      const id = draggingRef.current;
      if (!id) return;
      const n = nodesRef.current.get(id);
      if (n) {
        // Clamp so a thrown node can't be parked outside the viewport.
        const c = clampToArea(x, y, area);
        n.fx = c.x;
        n.fy = c.y;
      }
      const sim = simRef.current;
      if (sim && sim.alpha() < 0.3) sim.alpha(0.3);
    },
    [area],
  );

  const endDrag = useCallback(() => {
    const id = draggingRef.current;
    if (!id) return;
    const n = nodesRef.current.get(id);
    if (n) {
      n.fx = null;
      n.fy = null;
    }
    draggingRef.current = null;
    setDraggingId(null);
    const sim = simRef.current;
    if (sim) sim.alpha(Math.max(sim.alpha(), 0.35));
  }, []);

  return { startDrag, moveDrag, endDrag, draggingId };
}
