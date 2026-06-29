import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { MapData } from "../data/mapData";

interface LegendProps {
  data: MapData;
}

/**
 * A small, collapsible key for the network view: a swatch per domain (matching
 * the thread tints) plus a one-line note on what threads and node size mean.
 * Built entirely from mapData so it never drifts from the graph.
 */
export default function Legend({ data }: LegendProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className={`legend${open ? " is-open" : ""}`}>
      <button
        className="legend-toggle"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span className="legend-title">Legend</span>
        <ChevronDown className="legend-chevron" size={14} strokeWidth={1.5} />
      </button>

      {open ? (
        <div className="legend-body">
          <div className="legend-domains">
            {data.domains.map((d) => (
              <span key={d.id} className="legend-row">
                <span
                  className="legend-swatch"
                  style={{ background: d.color, color: d.color }}
                />
                <span className="legend-label">{d.label}</span>
              </span>
            ))}
          </div>
          <p className="legend-note">
            Threads link related work across domains · node size grows with connections
          </p>
        </div>
      ) : null}
    </div>
  );
}
