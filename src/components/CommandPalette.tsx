/* ============================================================
   CommandPalette.tsx
   ------------------------------------------------------------
   A lightweight ⌘K / Ctrl+K palette over mapData — no external
   dependency. Searches domains, facets (child nodes), selected
   works, and tags; actions focus a domain, open a node's drawer,
   switch views, or reset the overview. Keyboard: ↑ ↓ Enter Esc.
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from "react";
import { KIND_LABEL, type MapData } from "../data/mapData";
import type { ViewMode } from "../App";

interface PaletteItem {
  key: string;
  kind: "domain" | "node" | "work" | "view";
  label: string;
  sub: string;
  /** Lowercased haystack the query is matched against. */
  haystack: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  data: MapData;
  onClose: () => void;
  onFocusDomain: (id: string) => void;
  onOpenNode: (id: string) => void;
  onSetMode: (mode: ViewMode) => void;
  onReset: () => void;
}

export default function CommandPalette({
  open,
  data,
  onClose,
  onFocusDomain,
  onOpenNode,
  onSetMode,
  onReset,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Reset state each time the palette opens; focus the input.
  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      // Focus after the element exists in the DOM.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const out: PaletteItem[] = [
      {
        key: "view-map",
        kind: "view",
        label: "Open the map",
        sub: "View",
        haystack: "open map network overview honeycomb",
        run: () => onSetMode("map"),
      },
      {
        key: "view-dash",
        kind: "view",
        label: "Open Dashboards",
        sub: "View",
        haystack: "open dashboards reading panels overview",
        run: () => onSetMode("dash"),
      },
      {
        key: "view-reset",
        kind: "view",
        label: "Reset to overview",
        sub: "View",
        haystack: "reset overview unfocus back",
        run: () => {
          onSetMode("map");
          onReset();
        },
      },
    ];
    data.domains.forEach((d) => {
      out.push({
        key: `domain-${d.id}`,
        kind: "domain",
        label: d.label,
        sub: `Domain · ${d.children.length} facets`,
        haystack: `${d.label} ${d.blurb} domain`.toLowerCase(),
        run: () => onFocusDomain(d.id),
      });
      d.children.forEach((c) => {
        out.push({
          key: `node-${c.id}`,
          kind: "node",
          label: c.label,
          sub: `${d.label} · ${KIND_LABEL[c.type]}`,
          haystack: `${c.label} ${c.tip} ${d.label} ${KIND_LABEL[c.type]} ${(c.tags ?? []).join(" ")}`.toLowerCase(),
          run: () => onOpenNode(c.id),
        });
      });
    });
    data.selectedWorks.forEach((w) => {
      if (!w.url) return;
      const url = w.url;
      out.push({
        key: `work-${w.title}`,
        kind: "work",
        label: w.title,
        sub: `Selected work · ${w.meta}`,
        haystack: `${w.title} ${w.meta} ${w.desc} selected work`.toLowerCase(),
        run: () => window.open(url, "_blank", "noopener,noreferrer"),
      });
    });
    return out;
  }, [data, onFocusDomain, onOpenNode, onReset, onSetMode]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    const words = q.split(/\s+/);
    return items.filter((it) => words.every((w) => it.haystack.includes(w))).slice(0, 12);
  }, [items, query]);

  // Keep the active row in view as the selection moves.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [index, results]);

  if (!open) return null;

  const pick = (it: PaletteItem) => {
    onClose();
    it.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = results[Math.min(index, results.length - 1)];
      if (it) pick(it);
    }
    // Escape is handled globally in App (palette closes first).
  };

  return (
    <div className="cmdk-overlay" onClick={onClose} role="presentation">
      <div
        className="cmdk"
        role="dialog"
        aria-modal="true"
        aria-label="Search the knowledge map"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="cmdk-input"
          type="text"
          placeholder="Search domains, facets, works…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={onKeyDown}
          aria-label="Search the knowledge map"
        />
        <div className="cmdk-list" ref={listRef} role="listbox" aria-label="Results">
          {results.length === 0 ? (
            <div className="cmdk-empty">Nothing matches “{query}”.</div>
          ) : (
            results.map((it, i) => (
              <button
                key={it.key}
                className={`cmdk-item${i === index ? " is-active" : ""}`}
                data-active={i === index}
                role="option"
                aria-selected={i === index}
                onMouseEnter={() => setIndex(i)}
                onClick={() => pick(it)}
              >
                <span className="cmdk-item-label">{it.label}</span>
                <span className="cmdk-item-sub">{it.sub}</span>
              </button>
            ))
          )}
        </div>
        <div className="cmdk-hint" aria-hidden="true">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
