import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// One-off config: bundle the entire app (JS + CSS) into a single standalone
// index.html that opens straight from disk (file://) with no dev server.
// Build with:  npx vite build --config vite.config.singlefile.ts
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "dist-standalone",
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
  },
});
