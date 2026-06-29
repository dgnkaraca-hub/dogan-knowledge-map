import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface TooltipState {
  show: boolean;
  kindLabel: string;
  name: string;
  tip: string;
  /** Anchor point in client coordinates. */
  x: number;
  y: number;
}

interface TooltipProps {
  state: TooltipState;
}

/** Floating tooltip that flips to stay inside the viewport. */
export default function Tooltip({ state }: TooltipProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!state.show || !ref.current) return;
    const pad = 16;
    const w = ref.current.offsetWidth;
    const h = ref.current.offsetHeight;
    let left = state.x + pad;
    let top = state.y - h - pad;
    if (left + w > window.innerWidth - 10) left = state.x - w - pad;
    if (top < 70) top = state.y + pad;
    setPos({ left, top });
  }, [state]);

  return (
    <AnimatePresence>
      {state.show ? (
        <motion.div
          ref={ref}
          className="tooltip"
          role="status"
          aria-live="polite"
          style={{ left: pos.left, top: pos.top }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="tt-kind">{state.kindLabel}</div>
          <div className="tt-name">{state.name}</div>
          {state.tip ? <div className="tt-tip">{state.tip}</div> : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
