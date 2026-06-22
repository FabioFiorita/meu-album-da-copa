import { defineConfig } from "vitest/config";

// Convex backend tests run in the edge-runtime VM (required by convex-test).
// We only pick up test files under convex/ so vitest never tries to execute
// the React app. Globals are OFF — every test imports from "vitest" explicitly.
export default defineConfig({
  test: {
    environment: "edge-runtime",
    globals: false,
    include: ["convex/**/*.test.ts"],
    server: {
      deps: {
        inline: ["convex-test", "convex"],
      },
    },
  },
});
