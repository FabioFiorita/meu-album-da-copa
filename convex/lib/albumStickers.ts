import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { appError } from "./errors";
import { assertStickerExists } from "./templates";
import { duplicateDelta, ownedDelta, sanitizeCount } from "./counts";

export async function getStickerCount(
  ctx: MutationCtx | QueryCtx,
  albumId: Id<"albums">,
  stickerKey: string,
): Promise<number> {
  const doc = await ctx.db
    .query("albumStickers")
    .withIndex("by_album_sticker", (q) =>
      q.eq("albumId", albumId).eq("stickerKey", stickerKey),
    )
    .unique();
  return doc?.count ?? 0;
}

export async function setStickerCountAbsolute(
  ctx: MutationCtx,
  albumId: Id<"albums">,
  templateId: string,
  stickerKey: string,
  newCountRaw: number,
): Promise<void> {
  assertStickerExists(templateId, stickerKey);
  const newCount = sanitizeCount(newCountRaw);
  const album = await ctx.db.get("albums", albumId);
  if (!album) throw appError("ALBUM_NOT_FOUND");

  const existing = await ctx.db
    .query("albumStickers")
    .withIndex("by_album_sticker", (q) =>
      q.eq("albumId", albumId).eq("stickerKey", stickerKey),
    )
    .unique();

  const oldCount = existing?.count ?? 0;
  if (oldCount === newCount) {
    return;
  }

  const od = ownedDelta(oldCount, newCount);
  const dd = duplicateDelta(oldCount, newCount);
  const now = Date.now();
  const st = assertStickerExists(templateId, stickerKey);

  if (newCount === 0) {
    if (existing) {
      await ctx.db.delete("albumStickers", existing._id);
    }
    await ctx.db.patch("albums", albumId, {
      ownedCount: album.ownedCount + od,
      duplicateCount: album.duplicateCount + dd,
      updatedAt: now,
    });
    return;
  }

  if (existing) {
    await ctx.db.patch("albumStickers", existing._id, {
      count: newCount,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("albumStickers", {
      albumId,
      templateId,
      sectionId: st.sectionId,
      stickerNumber: st.number,
      stickerKey,
      count: newCount,
      updatedAt: now,
    });
  }

  await ctx.db.patch("albums", albumId, {
    ownedCount: album.ownedCount + od,
    duplicateCount: album.duplicateCount + dd,
    updatedAt: now,
  });
}
