import { useCallback, useMemo } from "react";
import { useMutation } from "convex/react";
import type { OptimisticLocalStore } from "convex/browser";
import { api } from "@convex/_generated/api";
import { duplicateDelta, ownedDelta, sanitizeCount } from "@convex/lib/counts";
import { buildStickerKey, parseStickerKey } from "@convex/lib/stickerKeys";
import type { AlbumSession } from "@/lib/albumSession";
import { percentage } from "@/lib/albumMath";

export type MarkQuickMode = "owned" | "duplicate";

type SnapshotArgs = { code: string; writeKey: string };

/**
 * Apply an absolute target count for `key` to the cached snapshot. Mirrors
 * `setStickerCountAbsolute`: sanitize the target, upsert/remove the sticker row,
 * and adjust album + section owned/duplicate totals by the same deltas.
 */
function applyAbsolute(
  localStore: OptimisticLocalStore,
  queryArgs: SnapshotArgs,
  key: string,
  newCountRaw: number,
) {
  const snapshot = localStore.getQuery(api.albums.getPrivateSnapshot, queryArgs);
  if (snapshot === undefined) return;

  const newCount = sanitizeCount(newCountRaw);
  const existing = snapshot.stickers.find((s) => s.key === key);
  const oldCount = existing?.count ?? 0;
  if (oldCount === newCount) return;

  const od = ownedDelta(oldCount, newCount);
  const dd = duplicateDelta(oldCount, newCount);
  const { sectionId, number } = parseStickerKey(key);

  let stickers = snapshot.stickers;
  if (newCount === 0) {
    stickers = stickers.filter((s) => s.key !== key);
  } else if (existing) {
    stickers = stickers.map((s) =>
      s.key === key
        ? { ...s, count: newCount, duplicateCount: Math.max(0, newCount - 1) }
        : s,
    );
  } else {
    stickers = [
      ...stickers,
      {
        key,
        sectionId,
        number,
        count: newCount,
        duplicateCount: Math.max(0, newCount - 1),
      },
    ];
  }

  const ownedCount = snapshot.album.ownedCount + od;
  const album = {
    ...snapshot.album,
    ownedCount,
    duplicateCount: snapshot.album.duplicateCount + dd,
    completionPercentage: percentage(ownedCount, snapshot.album.total),
  };

  const sections = snapshot.sections.map((sec) =>
    sec.id === sectionId
      ? {
          ...sec,
          ownedCount: sec.ownedCount + od,
          duplicateCount: sec.duplicateCount + dd,
        }
      : sec,
  );

  localStore.setQuery(api.albums.getPrivateSnapshot, queryArgs, {
    album,
    sections,
    stickers,
  });
}

function currentCount(
  localStore: OptimisticLocalStore,
  queryArgs: SnapshotArgs,
  key: string,
): number {
  const snapshot = localStore.getQuery(api.albums.getPrivateSnapshot, queryArgs);
  return snapshot?.stickers.find((s) => s.key === key)?.count ?? 0;
}

/**
 * Optimistic +/- helpers for the core "tenho / repetida" loop. Every mutation is
 * wrapped with an optimistic update whose math EXACTLY mirrors the server reducer
 * in `convex/lib/albumStickers.ts` (via the shared helpers in
 * `convex/lib/counts.ts`), so the UI never flickers or rolls back on success.
 *
 * `useMutation(...)` returns a referentially stable function, but calling
 * `.withOptimisticUpdate(...)` produces a fresh mutation each time, so we
 * memoize the optimistic wrappers (and the public helpers) on the session keys.
 * The returned `applyDelta` / `markQuick` / `setCount` are therefore stable
 * across renders, which lets memoized list rows skip re-rendering on every tick.
 */
export function useStickerActions(session: AlbumSession) {
  const { code, writeKey, templateId } = session;

  const addCopiesMutation = useMutation(api.stickers.addCopies);
  const markQuickBaseMutation = useMutation(api.stickers.markQuick);
  const setCountBaseMutation = useMutation(api.stickers.setCount);

  const addCopies = useMemo(
    () =>
      addCopiesMutation.withOptimisticUpdate((localStore, args) => {
        // Mirror addCopies: next = sanitizeCount(old + delta).
        const queryArgs = { code, writeKey };
        const old = currentCount(localStore, queryArgs, args.stickerKey);
        applyAbsolute(localStore, queryArgs, args.stickerKey, old + args.delta);
      }),
    [addCopiesMutation, code, writeKey],
  );

  const markQuickMutation = useMemo(
    () =>
      markQuickBaseMutation.withOptimisticUpdate((localStore, args) => {
        const queryArgs = { code, writeKey };
        const key = buildStickerKey(templateId, args.sectionId, args.number);
        const old = currentCount(localStore, queryArgs, key);
        // Mirror markQuick: "owned" -> 1 if not owned; "duplicate" -> 2 from 0/1 else +1.
        const next =
          args.mode === "owned"
            ? old < 1
              ? 1
              : old
            : old === 0
              ? 2
              : old === 1
                ? 2
                : sanitizeCount(old + 1);
        applyAbsolute(localStore, queryArgs, key, next);
      }),
    [markQuickBaseMutation, code, writeKey, templateId],
  );

  const setCountMutation = useMemo(
    () =>
      setCountBaseMutation.withOptimisticUpdate((localStore, args) => {
        // Mirror setCount: next = sanitizeCount(count).
        const queryArgs = { code, writeKey };
        applyAbsolute(
          localStore,
          queryArgs,
          args.stickerKey,
          sanitizeCount(args.count),
        );
      }),
    [setCountBaseMutation, code, writeKey],
  );

  const applyDelta = useCallback(
    (stickerKey: string, delta: number) =>
      addCopies({ code, writeKey, stickerKey, delta }),
    [addCopies, code, writeKey],
  );

  const markQuick = useCallback(
    (sectionId: string, number: string, mode: MarkQuickMode) =>
      markQuickMutation({ code, writeKey, sectionId, number, mode }),
    [markQuickMutation, code, writeKey],
  );

  const setCount = useCallback(
    (stickerKey: string, count: number) =>
      setCountMutation({ code, writeKey, stickerKey, count }),
    [setCountMutation, code, writeKey],
  );

  return { applyDelta, markQuick, setCount };
}
