import { normalizeAlbumCode, parseFullAccessCode } from "@convex/lib/access";

const PENDING_TRADE_CODE_KEY = "figurinhas.pendingTradeCode.v1";

export type ShareIntent =
  | { type: "join"; fullAccessCode: string }
  | { type: "trade"; publicCode: string };

function appRootUrl(): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${window.location.origin}${normalizedBase}`;
}

function buildAppHashUrl(path: "/join" | "/trade", key: string, value: string) {
  const url = new URL(appRootUrl());
  const params = new URLSearchParams({ [key]: value });
  url.hash = `${path}?${params.toString()}`;
  return url.toString();
}

export function buildJoinAlbumUrl(fullAccessCode: string): string {
  return buildAppHashUrl("/join", "code", fullAccessCode.trim());
}

export function buildTradeCompareUrl(publicCode: string): string {
  return buildAppHashUrl(
    "/trade",
    "code",
    normalizeAlbumCode(publicCode),
  );
}

export function parseShareIntent(): ShareIntent | null {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;

  const [path, rawSearch = ""] = hash.split("?");
  const params = new URLSearchParams(rawSearch);
  const code = params.get("code") ?? "";

  if (path === "/join") {
    const parsed = parseFullAccessCode(code);
    if (!parsed) return null;
    return { type: "join", fullAccessCode: code.trim() };
  }

  if (path === "/trade") {
    const publicCode = normalizeAlbumCode(code);
    if (publicCode.length < 8) return null;
    return { type: "trade", publicCode };
  }

  return null;
}

export function clearShareIntent(): void {
  if (!parseShareIntent()) return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

export function savePendingTradeCode(publicCode: string): void {
  sessionStorage.setItem(PENDING_TRADE_CODE_KEY, normalizeAlbumCode(publicCode));
}

export function consumePendingTradeCode(): string | null {
  const code = sessionStorage.getItem(PENDING_TRADE_CODE_KEY);
  sessionStorage.removeItem(PENDING_TRADE_CODE_KEY);
  if (!code) return null;
  const normalized = normalizeAlbumCode(code);
  return normalized.length >= 8 ? normalized : null;
}
