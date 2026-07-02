/* ============================================================
   useForceGraph.ts
   ------------------------------------------------------------
   The live motion engine for the honeycomb map. React owns the
   *state* (focus, area); this hook owns the *motion*.

   Layout is fully deterministic (computeNetwork snaps nodes to
   hex cells; computeTargets fans the focus tree), so there is no
   force simulation anymore — a single requestAnimationFrame loop
   eases every node toward its current target each frame:

   - Network view: targets are the hex-lattice homes. A dragged
     node follows the pointer directly and springs back to its
     cell on release.
   - Focus view: targets are the fan-tree positions, unfurling
     petal-by-petal via a per-leaf stagger.

   Positions are written straight to the DOM (node transforms,
   connector path `d`s) so the graph never re-renders per frame.
   The loop is visibility-gated and honors reduced motion.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildSimNodes,
  clampToArea,
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
  /** Deterministic hex layout used to seed node positions. */
  network: NetworkLayout;
  /** Per-node targets (hex homes / fan tree), read every frame. */
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
  const nodesRef = useRef<Map<string, SimNode>>(new Map());
  const draggingRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const focusRef = useRef<string | null>(focus);
  const rafRef = useRef<number | null>(null);
  // Timestamp the moment focus opens, so leaves can unfurl staggered.
  const focusStartRef = useRef<number>(0);

  // Build (or rebuild) the position holders when the graph or size changes.
  useEffect(() => {
    if (area.w === 0 || area.h === 0) return;
    const seed = network.pos.size > 0 ? network.pos : undefined;
    const nodes = buildSimNodes(data, area, graph, seed);
    const m = new Map<string, SimNode>();
    nodes.forEach((n) => m.set(n.id, n));
    nodesRef.current = m;
    // `network` is itself a pure function of (data, graph, area.w, area.h), so
    // it is omitted here to avoid a redundant second rebuild on every resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, area.w, area.h]);

  // Track focus; stamp the fan clock when a domain opens.
  useEffect(() => {
    focusRef.current = focus;
    if (focus) {
      focusStartRef.current = typeof performance !== "undefined" ? performance.now() : 0;
    }
  }, [focus]);

  // The single animation loop.
  useEffect(() => {
    if (!active) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    // Per-frame easing baseline (the feel knob), normalized below so the
    // motion converges at the same rate on 60Hz and 120Hz displays.
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
        // Both states ease toward their targets — the hex lattice in the
        // network view, the fan tree in focus. A dragged node is skipped
        // (it follows the pointer) and springs back home on release.
        // Snap within 0.3px so the lerp arrives instead of coasting.
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
      n.x = c.x;
      n.y = c.y;
      draggingRef.current = id;
      setDraggingId(id);
    },
    [area],
  );

  const moveDrag = useCallback(
    (x: number, y: number) => {
      const id = draggingRef.current;
      if (!id) return;
      const n = nodesRef.current.get(id);
      if (n) {
        // Write the position directly — the loop skips the dragged node, so
        // this is what makes it follow the pointer. Clamped so a node can't
        // be parked outside the viewport.
        const c = clampToArea(x, y, area);
        n.x = c.x;
        n.y = c.y;
      }
    },
    [area],
  );

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;
    // Nothing else to do: once the node is no longer flagged as dragging,
    // the loop eases it back to its hex home — the spring-back.
    draggingRef.current = null;
    setDraggingId(null);
  }, []);

  return { startDrag, moveDrag, endDrag, draggingId };
}
