import { defineConfig } from "vite";

export default defineConfig({
  root: "src/renderer",
  base: "./",
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: "src/renderer/index.html"
    }
  }
});

