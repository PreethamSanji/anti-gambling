import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false,
    proxy: {
      "/wallet": {
        target: "https://anti-gambling-backend.onrender.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wallet/, "/wallet"),
      },
    },
  },
  build: {
    sourcemap: true,
  },
});
