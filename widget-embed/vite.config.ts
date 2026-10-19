import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

// Two pages: index.html (plain HTML + script tag, no build step needed) and react.html (React).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { index: resolve(import.meta.dirname, "index.html"), react: resolve(import.meta.dirname, "react.html") },
    },
  },
});
