import { useCallback, useEffect, useState } from "react";
import { createFullAccessCode, parseFullAccessCode } from "@convex/lib/access";
import {
  ALBUM_SESSION_KEY,
  clearSession,
  loadSession,
  saveSession,
  type AlbumSession,
} from "@/lib/albumSession";

export function useAlbumSession() {
  const [session, setSessionState] = useState<AlbumSession | null>(() =>
    loadSession(),
  );

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === ALBUM_SESSION_KEY) {
        setSessionState(loadSession());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSession = useCallback((s: AlbumSession) => {
    saveSession(s);
    setSessionState(loadSession());
  }, []);

  const refresh = useCallback(() => {
    setSessionState(loadSession());
  }, []);

  const leaveLocal = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  const enterByFullCode = useCallback(
    (input: string): boolean => {
      const parsed = parseFullAccessCode(input);
      if (!parsed) return false;
      saveSession({
        templateId: "wc2026",
        code: parsed.code,
        writeKey: parsed.writeKey,
        fullAccessCode: createFullAccessCode(parsed.code, parsed.writeKey),
      });
      setSessionState(loadSession());
      return true;
    },
    [],
  );

  const updateSessionKeys = useCallback(
    (code: string, writeKey: string, fullAccessCode: string) => {
      saveSession({
        templateId: "wc2026",
        code,
        writeKey,
        fullAccessCode,
      });
      setSessionState(loadSession());
    },
    [],
  );

  return {
    session,
    setSession,
    refresh,
    leaveLocal,
    enterByFullCode,
    updateSessionKeys,
  };
}
