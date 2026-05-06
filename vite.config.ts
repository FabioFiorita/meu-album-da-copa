import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

import { cloudflare } from "@cloudflare/vite-plugin";

const PROD_CONVEX_URL = "https://zany-barracuda-225.convex.cloud";
const DEV_CONVEX_URL = "https://dapper-lion-274.convex.cloud";

function resolveConvexUrl(): string {
  if (process.env.VITE_CONVEX_URL) return process.env.VITE_CONVEX_URL;
  const branch =
    process.env.WORKERS_CI_BRANCH ?? process.env.CF_PAGES_BRANCH ?? "";
  return branch === "main" ? PROD_CONVEX_URL : DEV_CONVEX_URL;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
    },
  },
  define: {
    "import.meta.env.VITE_CONVEX_URL": JSON.stringify(resolveConvexUrl()),
  },
});
