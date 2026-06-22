/* eslint-disable react-refresh/only-export-components -- Provider + its companion useAlbumSnapshot hook intentionally live together. */
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { createContext, useContext, type ReactNode } from "react";
import { api } from "@convex/_generated/api";
import type { AlbumSession } from "@/lib/albumSession";

/**
 * The full private snapshot of an album (album summary, per-section summaries and
 * owned sticker rows), inferred directly from the Convex query so it stays in
 * sync with the backend contract.
 */
export type AlbumSnapshot = FunctionReturnType<
  typeof api.albums.getPrivateSnapshot
>;

type AlbumSnapshotContextValue = {
  snapshot: AlbumSnapshot | undefined;
  isLoading: boolean;
};

const AlbumSnapshotContext = createContext<AlbumSnapshotContextValue | null>(
  null,
);

/**
 * Runs the single shared `getPrivateSnapshot` subscription for the current
 * session and exposes it to every descendant tab through context. Convex dedupes
 * identical subscriptions, so tabs may keep their own `useQuery` during the
 * migration without opening extra websocket queries.
 */
export function AlbumSnapshotProvider({
  session,
  children,
}: {
  session: AlbumSession;
  children: ReactNode;
}) {
  const snapshot = useQuery(api.albums.getPrivateSnapshot, {
    code: session.code,
    writeKey: session.writeKey,
  });

  return (
    <AlbumSnapshotContext.Provider
      value={{ snapshot, isLoading: snapshot === undefined }}
    >
      {children}
    </AlbumSnapshotContext.Provider>
  );
}

/**
 * Reads the shared album snapshot. `snapshot === undefined` (and `isLoading`)
 * means the subscription has not resolved yet. Must be used within an
 * {@link AlbumSnapshotProvider}.
 */
export function useAlbumSnapshot(): AlbumSnapshotContextValue {
  const ctx = useContext(AlbumSnapshotContext);
  if (ctx === null) {
    throw new Error(
      "useAlbumSnapshot must be used within an AlbumSnapshotProvider",
    );
  }
  return ctx;
}
