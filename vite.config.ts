import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split large vendors out of the app entry for better long-term caching.
        // rolldown-vite only accepts the function form of manualChunks.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react/") ||
            id.includes("node_modules/scheduler")
          ) {
            return "react";
          }
          if (id.includes("node_modules/qrcode.react")) return "qr";
          if (id.includes("node_modules/convex")) return "convex";
        },
      },
    },
  },
});
