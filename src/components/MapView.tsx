import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ChildNode, Domain, MapData } from "../data/mapData";
import { computeArea, type Area } from "../lib/layout";
import RadialMap, { type TooltipHandlers } from "./RadialMap";
import Tooltip, { type TooltipState } from "./Tooltip";
import Legend from "./Legend";

interface MapViewProps {
  data: MapData;
  focus: string | null;
  selectedId: string | null;
  reduceMotion: boolean;
  active: boolean;
  onFocusDomain: (id: string) => void;
  onSetFocus: (id: string) => void;
  onOpenChild: (domain: Domain, child: ChildNode) => void;
  onResetFocus: () => void;
}

const ZERO_AREA: Area = { w: 0, h: 0, cx: 0, cy: 0, rd: 220 };
const EMPTY_TOOLTIP: TooltipState = { show: false, kindLabel: "", name: "", tip: "", x: 0, y: 0 };

export default function MapView({
  data,
  focus,
  selectedId,
  reduceMotion,
  active,
  onFocusDomain,
  onSetFocus,
  onOpenChild,
  onResetFocus,
}: MapViewProps) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [area, setArea] = useState<Area>(ZERO_AREA);
  const [tip, setTip] = useState<TooltipState>(EMPTY_TOOLTIP);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const apply = () => {
      const r = el.getBoundingClientRect();
      setArea(computeArea(r.width, r.height));
    };
    apply(); // measure once immediately on mount
    // Trailing debounce: a window drag fires resize every frame, and each
    // distinct size re-runs the 360-tick seed solve + rebuilds the live sim.
    // Only the settled size should pay that cost.
    let t: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      if (t) clearTimeout(t);
      t = setTimeout(apply, 120);
    });
    ro.observe(el);
    return () => {
      if (t) clearTimeout(t);
      ro.disconnect();
    };
  }, []);

  const tooltip: TooltipHandlers = {
    show: useCallback((kindLabel, name, tipText, x, y) => {
      setTip({ show: true, kindLabel, name, tip: tipText, x, y });
    }, []),
    move: useCallback((x, y) => {
      setTip((prev) => (prev.show ? { ...prev, x, y } : prev));
    }, []),
    hide: useCallback(() => {
      setTip((prev) => (prev.show ? { ...prev, show: false } : prev));
    }, []),
  };

  const handleBackgroundClick = () => {
    if (focus) onResetFocus();
  };

  // Cycle to the previous / next domain while focused.
  const cycle = (dir: 1 | -1) => {
    const i = data.domains.findIndex((d) => d.id === focus);
    if (i < 0) return;
    const next = (i + dir + data.domains.length) % data.domains.length;
    onSetFocus(data.domains[next].id);
  };

  return (
    <div className="absolute inset-0">
      <div
        ref={areaRef}
        className="absolute inset-x-0 bottom-0 top-16 overflow-hidden"
        onClick={handleBackgroundClick}
      >
        <RadialMap
          data={data}
          area={area}
          focus={focus}
          selectedId={selectedId}
          reduceMotion={reduceMotion}
          active={active}
          onFocusDomain={onFocusDomain}
          onOpenChild={onOpenChild}
          onResetFocus={onResetFocus}
          tooltip={tooltip}
        />
      </div>

      {/* Navigation arrows (focus mode) */}
      {focus ? (
        <div className="nav-arrows">
          <button
            className="nav-arrow"
            aria-label="Previous domain"
            aria-keyshortcuts="ArrowLeft"
            onClick={(e) => {
              e.stopPropagation();
              tooltip.hide();
              cycle(-1);
            }}
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button
            className="nav-arrow"
            aria-label="Next domain"
            aria-keyshortcuts="ArrowRight"
            onClick={(e) => {
              e.stopPropagation();
              tooltip.hide();
              cycle(1);
            }}
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      ) : null}

      {/* Hint — in focus it signposts how to get back; in overview it onboards. */}
      <div className="map-hint">
        {focus
          ? "Press Esc or click outside to return · ← → to switch domains"
          : "Select a domain to open its branch · drag nodes to explore · ⌘K to search"}
      </div>

      {/* Legend belongs to the overview; hidden in focus so it never collides
          with the < > navigation arrows. */}
      {active && !focus ? <Legend data={data} /> : null}

      <Tooltip state={tip} />
    </div>
  );
}
