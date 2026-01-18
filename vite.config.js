
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://lnmudb.onrender.com",
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api/, "")
      },
      // Proxy for external images to bypass CORS
      "/images": {
        target: "https://lnmuniversity.com",
        changeOrigin: true,
        rewrite: p => p.replace(/^\/images/, "")
      },
      // Proxy for QR code images to bypass CORS
      "/qrcode": {
        target: "https://api.qrserver.com",
        changeOrigin: true,
        rewrite: p => p.replace(/^\/qrcode/, "")
      }
    }
  }
});
