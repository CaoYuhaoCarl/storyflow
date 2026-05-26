import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:8002", changeOrigin: true },
      "/adk": {
        target: "http://127.0.0.1:8010",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/adk/, ""),
      },
    },
  },
});
