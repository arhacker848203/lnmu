import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "https://lnmuv2-production.up.railway.app
          ",
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api/, "")
      },
      "/images": {
        target: "https://lnmuniversity.com",
        changeOrigin: true,
        rewrite: p => p.replace(/^\/images/, "")
      },
      "/qrcode": {
        target: "https://api.qrserver.com",
        changeOrigin: true,
        rewrite: p => p.replace(/^\/qrcode/, "")
      }
    }
  }
});
