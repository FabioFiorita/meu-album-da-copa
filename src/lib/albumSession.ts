// Session is stored in localStorage on purpose: a non-HttpOnly cookie offers no
// extra protection against XSS (any JS can read it), and the browser cannot set
// HttpOnly cookies. The writeKey is only ever sent to Convex over HTTPS.
import type { AlbumTemplateId } from "@convex/lib/templates";

export type AlbumSession = {
  version: 1;
  templateId: AlbumTemplateId;
  code: string;
  writeKey: string;
  fullAccessCode: string;
  savedAt: number;
};

export const ALBUM_SESSION_KEY = "figurinhas.albumSession.v1";

export function loadSession(): AlbumSession | null {
  try {
    const raw = localStorage.getItem(ALBUM_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AlbumSession;
    if (
      parsed?.version !== 1 ||
      !parsed.code ||
      !parsed.writeKey ||
      !parsed.templateId
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Omit<AlbumSession, "version" | "savedAt"> & { version?: 1 }): void {
  if (!session.writeKey?.trim()) {
    return;
  }
  const full: AlbumSession = {
    version: 1,
    templateId: session.templateId,
    code: session.code,
    writeKey: session.writeKey,
    fullAccessCode: session.fullAccessCode,
    savedAt: Date.now(),
  };
  localStorage.setItem(ALBUM_SESSION_KEY, JSON.stringify(full));
}

export function clearSession(): void {
  localStorage.removeItem(ALBUM_SESSION_KEY);
}
