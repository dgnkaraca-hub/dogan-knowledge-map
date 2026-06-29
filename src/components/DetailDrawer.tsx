import { AnimatePresence, motion } from "framer-motion";
import { KIND_LABEL } from "../data/mapData";
import type { Selection } from "../App";

interface DetailDrawerProps {
  selection: Selection | null;
  onClose: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function DetailDrawer({ selection, onClose }: DetailDrawerProps) {
  const node = selection?.node;
  const kind = node ? KIND_LABEL[node.type] : "";

  return (
    <AnimatePresence>
      {selection && node ? (
        <div key="drawer-root">
          {/* Scrim */}
          <motion.div
            className="fixed inset-0 z-[45]"
            style={{ background: "rgba(4,7,16,0.6)", backdropFilter: "blur(2px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className="fixed inset-y-0 right-0 z-[46] flex w-[min(420px,92vw)] flex-col border-l border-hair bg-panel"
            style={{ boxShadow: "-30px 0 60px -40px rgba(0,0,0,0.4)" }}
            role="dialog"
            aria-modal="true"
            aria-label={node.label}
            initial={{ x: "102%" }}
            animate={{ x: 0 }}
            exit={{ x: "102%" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <button
              onClick={onClose}
              aria-label="Close detail"
              className="absolute right-5 top-5 grid h-[34px] w-[34px] place-items-center rounded-full border border-hair bg-bg text-base leading-none text-ink transition-transform duration-300 hover:rotate-90 hover:border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              ×
            </button>

            <div className="border-b border-hair px-7 pb-[18px] pt-[26px]">
              <div className="mb-[14px] flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted">
                <span>{selection.domainLabel}</span>
                <span className="text-line">/</span>
                <span>{kind}</span>
              </div>
              <span className="mb-3 inline-block rounded-full border border-accent px-[10px] py-1 text-[9px] uppercase tracking-[0.18em] text-accent">
                {kind}
              </span>
              <h2 className="font-display text-[30px] leading-[1.04]">{node.label}</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-[22px]">
              <p className="mb-[18px] text-[14.5px] leading-[1.65]" style={{ color: "var(--text-2)" }}>
                {node.desc}
              </p>

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
                <div className="drawer-links flex flex-col gap-2">
                  {node.links.map((lk) => (
                    <a key={lk.url} href={lk.url} target="_blank" rel="noopener noreferrer">
                      <span>{lk.label}</span>
                      <span className="text-muted">↗</span>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
