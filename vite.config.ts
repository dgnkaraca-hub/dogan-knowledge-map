import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use a relative base so the production build also works when served
  // from a sub-path (e.g. GitHub Pages project sites).
  base: "./",
  server: {
    port: 5173,
    open: false,
  },
});
