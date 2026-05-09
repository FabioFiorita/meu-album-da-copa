import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App.tsx";
import { applyAppTheme, readStoredTheme } from "@/lib/appTheme";

function syncRootColorScheme() {
  applyAppTheme(readStoredTheme());
}

syncRootColorScheme();

function resolveConvexUrl(rawUrl: string) {
  if (typeof window === "undefined") return rawUrl;

  const pageHost = window.location.hostname;
  const pageIsLocalhost =
    pageHost === "localhost" || pageHost === "127.0.0.1" || pageHost === "::1";
  if (pageIsLocalhost) return rawUrl;

  try {
    const url = new URL(rawUrl);
    const convexIsLoopback =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (convexIsLoopback) {
      url.hostname = pageHost;
      return url.origin;
    }
  } catch {
    return rawUrl;
  }

  return rawUrl;
}

const convex = new ConvexReactClient(
  resolveConvexUrl(import.meta.env.VITE_CONVEX_URL as string),
);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
);
