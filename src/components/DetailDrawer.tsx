/* ============================================================
   DetailDrawer.tsx
   ------------------------------------------------------------
   The knowledge panel for a focused leaf node. More than a
   label + description: it surfaces the node's status, facts
   (year / role / location), metrics, extended reading, tags,
   links, related nodes (derived from the relations threads,
   navigable), and a subtle source/confidence footnote.
   ============================================================ */

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CONFIDENCE_LABEL, KIND_LABEL, STATUS_LABEL } from "../data/mapData";
import type { Selection } from "../App";

/** A related node resolved by App from the relations[] threads. */
export interface RelatedItem {
  id: string;
  label: string;
  domainLabel: string;
  kindLabel: string;
  /** Human sentence explaining the connection, when the relation has one. */
  relationLabel?: string;
  /** The relation type ("method", "media", ...) when present. */
  relationType?: string;
}

interface DetailDrawerProps {
  selection: Selection | null;
  related: RelatedItem[];
  onOpenNode: (id: string) => void;
  onClose: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function DetailDrawer({
  selection,
  related,
  onOpenNode,
  onClose,
}: DetailDrawerProps) {
  const node = selection?.node;
  const kind = node ? KIND_LABEL[node.type] : "";
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Move focus into the dialog when it opens (and when navigating between
  // related nodes) so keyboard users land inside the panel.
  useEffect(() => {
    if (selection) closeRef.current?.focus();
  }, [selection]);

  // Compact facts row: only the fields that exist.
  const facts = node
    ? ([
        node.year ? { k: "Year", v: node.year } : null,
        node.role ? { k: "Role", v: node.role } : null,
        node.location ? { k: "Location", v: node.location } : null,
      ].filter(Boolean) as { k: string; v: string }[])
    : [];

  return (
    <AnimatePresence>
      {selection && node ? (
        <div key="drawer-root">
          {/* Scrim */}
          <motion.div
            className="fixed inset-0 z-[45]"
            style={{ background: "rgba(2,4,10,0.62)", backdropFilter: "blur(3px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className="drawer-panel fixed inset-y-0 right-0 z-[46] flex w-[min(440px,94vw)] flex-col border-l border-hair"
            role="dialog"
            aria-modal="true"
            aria-label={node.label}
            initial={{ x: "102%" }}
            animate={{ x: 0 }}
            exit={{ x: "102%" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close detail"
              className="absolute right-5 top-5 grid h-[34px] w-[34px] place-items-center rounded-full border border-hair bg-bg text-base leading-none text-ink transition-transform duration-300 hover:rotate-90 hover:border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              ×
            </button>

            {/* Header */}
            <div className="border-b border-hair px-7 pb-[18px] pt-[26px]">
              <div className="mb-[14px] flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted">
                <span>{selection.domainLabel}</span>
                <span className="text-line">/</span>
                <span>{kind}</span>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-[7px]">
                <span className="drawer-chip drawer-chip-kind">{kind}</span>
                {node.status ? (
                  <span className={`drawer-chip drawer-chip-status is-${node.status}`}>
                    {STATUS_LABEL[node.status]}
                  </span>
                ) : null}
              </div>
              <h2 className="font-display text-[30px] leading-[1.04] text-ink">{node.label}</h2>
              {facts.length > 0 ? (
                <div className="drawer-facts">
                  {facts.map((f) => (
                    <span key={f.k} className="drawer-fact">
                      <span className="drawer-fact-k">{f.k}</span>
                      <span className="drawer-fact-v">{f.v}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-7 py-[22px]">
              <p className="mb-[16px] text-[14.5px] leading-[1.65]" style={{ color: "var(--text-2)" }}>
                {node.desc}
              </p>

              {node.extended ? (
                <p className="drawer-extended">{node.extended}</p>
              ) : null}

              {node.metrics && node.metrics.length > 0 ? (
                <div className="drawer-metrics">
                  {node.metrics.map((m) => (
                    <div key={m.label} className="drawer-metric">
                      <span className="drawer-metric-v">{m.value}</span>
                      <span className="drawer-metric-k">{m.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {node.tags && node.tags.length > 0 ? (
                <div className="mb-[22px] flex flex-wrap gap-[7px]">
                  {node.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-hair px-[11px] py-[5px] text-[10px] uppercase tracking-[0.08em] text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}

              {node.links && node.links.length > 0 ? (
                <div className="drawer-links mb-[22px] flex flex-col gap-2">
                  {node.links.map((lk) => (
                    <a key={lk.url} href={lk.url} target="_blank" rel="noopener noreferrer">
                      <span>
                        {lk.label}
                        {lk.note ? <span className="drawer-link-note"> · {lk.note}</span> : null}
                      </span>
                      <span className="text-muted">↗</span>
                    </a>
                  ))}
                </div>
              ) : null}

              {/* Related nodes, derived from the map's relation threads */}
              {related.length > 0 ? (
                <div className="drawer-related">
                  <div className="drawer-section-label">Connected in the map</div>
                  {related.map((r) => (
                    <button key={r.id} className="drawer-related-item" onClick={() => onOpenNode(r.id)}>
                      <span className="drawer-related-main">
                        <span className="drawer-related-label">{r.label}</span>
                        <span className="drawer-related-meta">
                          {r.domainLabel} · {r.kindLabel}
                        </span>
                      </span>
                      {r.relationLabel ? (
                        <span className="drawer-related-why">{r.relationLabel}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}

              {node.relatedActions && node.relatedActions.length > 0 ? (
                <div className="drawer-actions">
                  {node.relatedActions.map((a) => (
                    <span key={a} className="drawer-action">
                      {a}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Source / confidence footnote */}
            {node.confidence || node.source ? (
              <div className="drawer-source">
                {node.confidence ? (
                  <span className={`drawer-conf is-${node.confidence}`}>
                    {CONFIDENCE_LABEL[node.confidence]}
                  </span>
                ) : null}
                {node.source ? (
                  <span className="drawer-source-text">
                    {node.source.url ? (
                      <a href={node.source.url} target="_blank" rel="noopener noreferrer">
                        {node.source.label ?? node.source.kind}
                      </a>
                    ) : (
                      node.source.label ?? node.source.kind
                    )}
                    {node.source.note ? ` — ${node.source.note}` : ""}
                  </span>
                ) : null}
              </div>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
