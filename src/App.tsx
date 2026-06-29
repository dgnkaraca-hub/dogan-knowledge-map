import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { mapData, type ChildNode, type Domain } from "./data/mapData";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import TopBar from "./components/TopBar";
import MapView from "./components/MapView";
import Dashboards from "./components/Dashboards";
import DetailDrawer from "./components/DetailDrawer";

export type ViewMode = "map" | "dash";

/** The node currently shown in the detail drawer, with its domain context. */
export interface Selection {
  domainLabel: string;
  node: ChildNode;
}

export default function App() {
  const reduceMotion = usePrefersReducedMotion();

  const [mode, setMode] = useState<ViewMode>("map");
  const [focus, setFocus] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);

  const closeDrawer = useCallback(() => setSelection(null), []);

  const resetFocus = useCallback(() => {
    setFocus(null);
    setSelection(null);
  }, []);

  const handleModeChange = useCallback(
    (next: ViewMode) => {
      setMode(next);
      if (next !== "map") {
        setSelection(null);
      }
    },
    [],
  );

  const handleFocusDomain = useCallback((id: string) => {
    setSelection(null);
    setFocus((prev) => (prev === id ? null : id));
  }, []);

  const handleSetFocus = useCallback((id: string) => {
    setSelection(null);
    setFocus(id);
  }, []);

  const handleOpenChild = useCallback((domain: Domain, child: ChildNode) => {
    setSelection({ domainLabel: domain.label, node: child });
  }, []);

  // Esc closes the drawer first, then clears the focused branch.
  // Arrow keys cycle between domains while focused (mirrors the < > arrows).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selection) setSelection(null);
        else if (focus) resetFocus();
        return;
      }
      if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && focus && !selection) {
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const i = mapData.domains.findIndex((d) => d.id === focus);
        if (i < 0) return;
        const next = (i + dir + mapData.domains.length) % mapData.domains.length;
        setFocus(mapData.domains[next].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, focus, resetFocus]);

  // Deep-linking: read the focused domain from the URL hash on load and on
  // back/forward, so a focused view is shareable and survives reload.
  useEffect(() => {
    const fromHash = () => {
      const m = window.location.hash.match(/^#\/domain\/(.+)$/);
      const id = m?.[1];
      if (id && mapData.domains.some((d) => d.id === id)) {
        setSelection(null);
        setFocus(id);
      } else {
        setFocus(null);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  // Reflect focus back into the hash (replaceState avoids history spam and any
  // feedback loop). The first run is skipped so the hash read above is kept.
  const hashSyncedRef = useRef(false);
  useEffect(() => {
    if (!hashSyncedRef.current) {
      hashSyncedRef.current = true;
      return;
    }
    const base = window.location.pathname + window.location.search;
    if (focus) window.history.replaceState(null, "", `${base}#/domain/${focus}`);
    else if (window.location.hash.startsWith("#/domain/"))
      window.history.replaceState(null, "", base);
  }, [focus]);

  return (
    <div className="relative h-full w-full">
      <TopBar
        mode={mode}
        onModeChange={handleModeChange}
        showReset={mode === "map" && focus !== null}
        onReset={resetFocus}
      />

      {/* Map stays mounted so the animation engine keeps its state. */}
      <MapView
        data={mapData}
        focus={focus}
        selectedId={selection?.node.id ?? null}
        reduceMotion={reduceMotion}
        active={mode === "map"}
        onFocusDomain={handleFocusDomain}
        onSetFocus={handleSetFocus}
        onOpenChild={handleOpenChild}
        onResetFocus={resetFocus}
      />

      {/* Dashboards overlay the map and replay their entrance on each visit. */}
      <AnimatePresence>
        {mode === "dash" ? (
          <motion.div
            key="dash"
            className="fixed inset-0 z-20 bg-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Dashboards data={mapData} onOpenMap={() => handleModeChange("map")} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <DetailDrawer selection={selection} onClose={closeDrawer} />
    </div>
  );
}
