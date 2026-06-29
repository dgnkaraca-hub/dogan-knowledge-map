import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ChildNode, Domain, MapData } from "../data/mapData";
import { KIND_LABEL } from "../data/mapData";
import {
  buildGraph,
  computeArea,
  computeNetwork,
  computeTargets,
  hexSize,
  honeycombCells,
  hexPath,
  type Area,
  type LayoutResult,
  type NetworkLayout,
  type NodeTarget,
} from "../lib/layout";
import { iconForChild, iconForDomain } from "../lib/icons";
import { useForceGraph, type ForceGraphRefs } from "../hooks/useForceGraph";

export interface TooltipHandlers {
  show: (kindLabel: string, name: string, tip: string, x: number, y: number) => void;
  move: (x: number, y: number) => void;
  hide: () => void;
}

interface RadialMapProps {
  data: MapData;
  area: Area;
  focus: string | null;
  selectedId: string | null;
  reduceMotion: boolean;
  active: boolean;
  onFocusDomain: (id: string) => void;
  onOpenChild: (domain: Domain, child: ChildNode) => void;
  onResetFocus: () => void;
  tooltip: TooltipHandlers;
}

interface Bubble {
  left: number;
  top: number;
  size: number;
  dur: number;
  delay: number;
  dx: number;
  dy: number;
}

const EMPTY_TARGET: NodeTarget = { tx: 0, ty: 0, hidden: false, dim: false, size: 0 };
const EMPTY_NETWORK: NetworkLayout = { pos: new Map(), degree: new Map() };

function makeBubbles(n: number): Bubble[] {
  const out: Bubble[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1.5 + Math.random() * 4.5,
      dur: 9 + Math.random() * 14,
      delay: -Math.random() * 20,
      dx: (Math.random() - 0.5) * 60,
      dy: -20 - Math.random() * 60,
    });
  }
  return out;
}

export default function RadialMap({
  data,
  area,
  focus,
  selectedId,
  reduceMotion,
  active,
  onFocusDomain,
  onOpenChild,
  onResetFocus,
  tooltip,
}: RadialMapProps) {
  const graph = useMemo(() => buildGraph(data), [data]);
  const bubbles = useMemo(() => makeBubbles(46), []);

  const domainById = useMemo(() => {
    const m = new Map<string, Domain>();
    data.domains.forEach((d) => m.set(d.id, d));
    return m;
  }, [data]);
  const childById = useMemo(() => {
    const m = new Map<string, { domain: Domain; child: ChildNode }>();
    data.domains.forEach((d) => d.children.forEach((c) => m.set(c.id, { domain: d, child: c })));
    return m;
  }, [data]);

  // Frozen solve seeds the live simulation so it opens already settled.
  const network = useMemo<NetworkLayout>(() => {
    if (area.w === 0 || area.h === 0) return EMPTY_NETWORK;
    return computeNetwork(data, area, graph);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, graph, area.w, area.h]);

  const nodeEls = useRef<Map<string, HTMLElement>>(new Map());
  const lineEls = useRef<Map<string, SVGLineElement>>(new Map());
  const pathEls = useRef<Map<string, SVGPathElement>>(new Map());
  const centerEl = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  // Stable identity: the underlying ref Maps are created once, so memoizing the
  // wrapper keeps the rAF loop reading the same object across renders.
  const refs = useMemo<ForceGraphRefs>(
    () => ({
      nodeEls: nodeEls.current,
      lineEls: lineEls.current,
      pathEls: pathEls.current,
      centerEl,
    }),
    [],
  );

  const targetsRef = useRef<Record<string, NodeTarget>>({});
  const [hoverId, setHoverId] = useState<string | null>(null);

  const [layout, setLayout] = useState<LayoutResult>(() => {
    // Read window only once, at mount, for the first-paint estimate.
    const initialArea = area.w > 0 ? area : computeArea(window.innerWidth, window.innerHeight);
    return computeTargets(data, initialArea, focus, reduceMotion, EMPTY_NETWORK);
  });

  useLayoutEffect(() => {
    if (area.w === 0 || area.h === 0) return;
    const result = computeTargets(data, area, focus, reduceMotion, network);
    setLayout(result);
    targetsRef.current = result.targets;
  }, [data, area, focus, reduceMotion, network]);

  const { startDrag, moveDrag, endDrag, draggingId } = useForceGraph({
    data,
    graph,
    area,
    network,
    targetsRef,
    focus,
    reduceMotion,
    active,
    refs,
  });

  // Keep the tooltip glued to its node as the web drifts (works for keyboard
  // focus too). The rAF runs only while something is hovered and not dragging.
  useEffect(() => {
    if (!hoverId || draggingId) return;
    let raf = 0;
    const follow = () => {
      const el = nodeEls.current.get(hoverId);
      if (el) {
        const r = el.getBoundingClientRect();
        tooltip.move(r.left, r.top);
      }
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverId, draggingId]);

  // Drag wiring: pointer down on a node grabs it; window listeners track the
  // drag and a small movement threshold suppresses the click that follows.
  const movedRef = useRef(false);
  const pointerTypeRef = useRef<string>("mouse");
  const toLocal = (clientX: number, clientY: number) => {
    const r = layerRef.current?.getBoundingClientRect();
    return { x: clientX - (r?.left ?? 0), y: clientY - (r?.top ?? 0) };
  };
  const handlePointerDown = (id: string) => (e: React.PointerEvent) => {
    if (focus) return; // dragging only in the network view
    if (e.button !== 0) return;
    movedRef.current = false;
    pointerTypeRef.current = e.pointerType || "mouse";
    // Fingers wander more than a mouse, so allow a larger pre-click slop.
    const slop = e.pointerType === "touch" ? 8 : 3;
    const sx = e.clientX;
    const sy = e.clientY;
    const p = toLocal(e.clientX, e.clientY);
    // Keep receiving move/up even if the pointer slips off the small disc.
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* not fatal if unsupported */
    }
    startDrag(id, p.x, p.y);
    setHoverId(null);
    tooltip.hide();
    const onMove = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - sx) > slop || Math.abs(ev.clientY - sy) > slop)
        movedRef.current = true;
      const q = toLocal(ev.clientX, ev.clientY);
      moveDrag(q.x, q.y);
    };
    const onUp = () => {
      endDrag();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    // A cancelled gesture (OS scroll, call, etc.) must release the node too,
    // otherwise it stays pinned and the tooltip stays suppressed.
    window.addEventListener("pointercancel", onUp);
  };

  // Honeycomb backdrop: a faint hex lattice fills the field, and every occupied
  // node sits in a brighter hex cell — the "intelligent geometric" structure.
  const hs = hexSize(area);
  const hexCells = useMemo(
    () => (area.w > 0 ? honeycombCells(area, hexSize(area)) : []),
    [area.w, area.h],
  );
  const nodeCells = useMemo(() => Array.from(network.pos.values()), [network]);

  return (
    <div className="map-layer absolute inset-0" ref={layerRef} style={{ transformOrigin: "0 0" }}>
      {/* Hexagonal honeycomb lattice behind everything (hidden in focus). */}
      {area.w > 0 && !focus ? (
        <svg className="hex-svg" aria-hidden="true">
          {hexCells.map((c, i) => (
            <path key={i} className="hex-cell" d={hexPath(c.x, c.y, hs)} />
          ))}
          {nodeCells.map((p, i) => (
            <path
              key={`n${i}`}
              className="hex-node"
              d={hexPath(p.x, p.y, hs)}
              style={{ animationDelay: `${((i * 0.83) % 4).toFixed(2)}s` }}
            />
          ))}
        </svg>
      ) : null}

      {/* Floating bubbles in the space between the web (animate only while
          the map is the active view, so they don't tick under Dashboards) */}
      <div className={`bubbles${active ? " is-active" : ""}`} aria-hidden="true">
        {bubbles.map((b, i) => (
          <span
            key={i}
            className="bubble"
            style={
              {
                left: `${b.left}%`,
                top: `${b.top}%`,
                width: b.size,
                height: b.size,
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.delay}s`,
                "--dx": `${b.dx}px`,
                "--dy": `${b.dy}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Ghost watermark of the focused domain */}
      <div
        className="ghost"
        style={{ left: area.cx, top: area.cy, opacity: layout.ghost.show ? 1 : 0 }}
        aria-hidden="true"
      >
        {layout.ghost.label}
      </div>

      {/* Connectors: hex-aligned elbow traces (all rendered as <path>). */}
      <svg className="line-svg" aria-hidden="true">
        {graph.lines.map((l) => {
          const st = layout.lineStates[l.id] ?? { dim: false, active: false, on: false };
          const cls =
            l.kind === "relation"
              ? `thread${st.on ? " on" : ""}`
              : l.kind === "spoke"
                ? `spoke${st.dim ? " dim" : ""}${st.active ? " active" : ""}`
                : `branch${st.on ? " on" : ""}${st.active ? " active" : ""}`;
          return (
            <path
              key={l.id}
              className={cls}
              fill="none"
              style={l.kind === "relation" && l.color ? { stroke: l.color } : undefined}
              ref={(el) => {
                if (el) pathEls.current.set(l.id, el);
                else pathEls.current.delete(l.id);
              }}
            />
          );
        })}
      </svg>

      {/* Peripheral domain labels */}
      <div className="absolute inset-0">
        {data.domains.map((d) => {
          const info = layout.domainLabels[d.id];
          if (!info) return null;
          const cls = [
            "domain-label",
            `align-${info.align}`,
            info.dim ? "is-dim" : "",
            info.hidden ? "is-hidden" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div
              key={d.id}
              className={cls}
              style={{ transform: `translate(${info.x}px, ${info.y}px)` }}
            >
              <button
                className="domain-label-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  tooltip.hide();
                  onFocusDomain(d.id);
                }}
              >
                <span className="dl-name">{d.label}</span>
                <span className="dl-sub">{d.children.length} facets</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Nodes */}
      <div className="absolute inset-0">
        <div className={`center-mark${focus ? " is-dim" : ""}`} ref={centerEl} aria-hidden="true">
          <span className="cm-ring" />
          <span className="cm-dot" />
        </div>

        {graph.nodes.map((n) => {
          if (n.kind === "center") return null;
          const target = layout.targets[n.id] ?? EMPTY_TARGET;
          const isDomain = n.kind === "domain";
          const isActiveHub = isDomain && focus === n.id;
          const isActive = selectedId === n.id;
          const isDragging = draggingId === n.id;

          const classes = [
            "map-node",
            isDomain ? "is-domain" : "is-child",
            isActiveHub ? "is-hub" : "",
            target.dim ? "is-dim" : "",
            target.hidden ? "is-hidden" : "",
            isActive ? "is-active" : "",
            isDragging ? "is-dragging" : "",
            !focus ? "is-grabbable" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const discStyle =
            target.size > 0 ? { width: target.size, height: target.size } : undefined;

          let IconCmp;
          if (isDomain) IconCmp = iconForDomain(n.id);
          else {
            const rec = childById.get(n.id);
            IconCmp = rec ? iconForChild(rec.child.id, rec.child.type) : iconForDomain(n.id);
          }

          const handleEnter = (e: React.MouseEvent) => {
            if (draggingId) return;
            setHoverId(n.id);
            if (isDomain) {
              const d = domainById.get(n.id)!;
              tooltip.show("Domain", d.label, d.blurb, e.clientX, e.clientY);
            } else {
              const rec = childById.get(n.id)!;
              tooltip.show(
                KIND_LABEL[rec.child.type],
                rec.child.label,
                rec.child.tip,
                e.clientX,
                e.clientY,
              );
            }
          };
          const handleFocusEvt = (e: React.FocusEvent<HTMLButtonElement>) => {
            setHoverId(n.id);
            const r = e.currentTarget.getBoundingClientRect();
            const fx = r.left + r.width / 2;
            const fy = r.top + r.height / 2;
            if (isDomain) {
              const d = domainById.get(n.id)!;
              tooltip.show("Domain", d.label, d.blurb, fx, fy);
            } else {
              const rec = childById.get(n.id)!;
              tooltip.show(KIND_LABEL[rec.child.type], rec.child.label, rec.child.tip, fx, fy);
            }
          };
          const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (movedRef.current) {
              movedRef.current = false;
              return; // this was a drag, not a click
            }
            tooltip.hide();
            if (isDomain) {
              if (isActiveHub) onResetFocus();
              else onFocusDomain(n.id);
            } else {
              const rec = childById.get(n.id)!;
              onOpenChild(rec.domain, rec.child);
            }
          };

          return (
            <div
              key={n.id}
              className={classes}
              ref={(el) => {
                if (el) nodeEls.current.set(n.id, el);
                else nodeEls.current.delete(n.id);
              }}
            >
              <button
                className="hit"
                aria-label={n.label}
                onPointerDown={handlePointerDown(n.id)}
                onMouseEnter={handleEnter}
                onMouseLeave={() => {
                  setHoverId(null);
                  tooltip.hide();
                }}
                onFocus={handleFocusEvt}
                onBlur={() => {
                  setHoverId(null);
                  tooltip.hide();
                }}
                onClick={handleClick}
              >
                <span className="disc" style={discStyle}>
                  <IconCmp className="ico" strokeWidth={1.5} />
                </span>
              </button>
              {isActiveHub ? (
                <span className="hub-label">
                  <span className="hl-name">{domainById.get(n.id)?.label}</span>
                  <span className="hl-sub">{domainById.get(n.id)?.blurb}</span>
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
