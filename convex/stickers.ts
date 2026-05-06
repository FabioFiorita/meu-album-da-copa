import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  getStickerCount,
  setStickerCountAbsolute,
} from "./lib/albumStickers";
import { requireWriteAccess } from "./lib/albumAccess";
import { COUNT_MAX, sanitizeCount } from "./lib/counts";
import { appError } from "./lib/errors";
import {
  buildStickerKey,
  normalizeStickerKey,
  parseStickerKey,
} from "./lib/stickerKeys";
import { assertStickerExists, stickerExists } from "./lib/templates";

function resolveKey(templateId: string, stickerKeyRaw: string): string {
  const raw = stickerKeyRaw.trim();
  try {
    if (raw.includes(":")) {
      const { sectionId, number } = parseStickerKey(raw);
      return buildStickerKey(templateId, sectionId, number);
    }
    return normalizeStickerKey(raw, templateId);
  } catch {
    throw appError("INVALID_STICKER");
  }
}

export const setCount = mutation({
  args: {
    code: v.string(),
    writeKey: v.string(),
    stickerKey: v.string(),
    count: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
    const key = resolveKey(album.templateId, args.stickerKey);
    assertStickerExists(album.templateId, key);
    const next = sanitizeCount(args.count);
    await setStickerCountAbsolute(
      ctx,
      album._id,
      album.templateId,
      key,
      next,
    );
    return null;
  },
});

export const addCopies = mutation({
  args: {
    code: v.string(),
    writeKey: v.string(),
    stickerKey: v.string(),
    delta: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
    const key = resolveKey(album.templateId, args.stickerKey);
    assertStickerExists(album.templateId, key);
    const cur = await getStickerCount(ctx, album._id, key);
    const next = sanitizeCount(cur + args.delta);
    await setStickerCountAbsolute(
      ctx,
      album._id,
      album.templateId,
      key,
      next,
    );
    return null;
  },
});

export const setOwned = mutation({
  args: {
    code: v.string(),
    writeKey: v.string(),
    stickerKey: v.string(),
    owned: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
    const key = resolveKey(album.templateId, args.stickerKey);
    assertStickerExists(album.templateId, key);
    const cur = await getStickerCount(ctx, album._id, key);
    if (args.owned) {
      const next = cur < 1 ? 1 : cur;
      await setStickerCountAbsolute(
        ctx,
        album._id,
        album.templateId,
        key,
        next,
      );
    } else {
      await setStickerCountAbsolute(
        ctx,
        album._id,
        album.templateId,
        key,
        0,
      );
    }
    return null;
  },
});

export const markQuick = mutation({
  args: {
    code: v.string(),
    writeKey: v.string(),
    sectionId: v.string(),
    number: v.string(),
    mode: v.union(v.literal("owned"), v.literal("duplicate")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
    const key = buildStickerKey(
      album.templateId,
      args.sectionId,
      args.number,
    );
    assertStickerExists(album.templateId, key);
    const cur = await getStickerCount(ctx, album._id, key);
    if (args.mode === "owned") {
      const next = cur < 1 ? 1 : cur;
      await setStickerCountAbsolute(
        ctx,
        album._id,
        album.templateId,
        key,
        next,
      );
    } else {
      let next: number;
      if (cur === 0) next = 2;
      else if (cur === 1) next = 2;
      else next = sanitizeCount(cur + 1);
      await setStickerCountAbsolute(
        ctx,
        album._id,
        album.templateId,
        key,
        next,
      );
    }
    return null;
  },
});

export const bulkImportCounts = mutation({
  args: {
    code: v.string(),
    writeKey: v.string(),
    mode: v.union(v.literal("replace"), v.literal("merge")),
    items: v.array(
      v.object({ stickerKey: v.string(), count: v.number() }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
    if (args.items.length > 994) {
      throw appError("COUNT_LIMIT_EXCEEDED");
    }
    const normalized: Array<{ key: string; count: number }> = [];
    for (const it of args.items) {
      const key = resolveKey(album.templateId, it.stickerKey);
      if (!stickerExists(album.templateId, key)) {
        throw appError("INVALID_STICKER");
      }
      const c = sanitizeCount(it.count);
      if (c > COUNT_MAX) {
        throw appError("COUNT_LIMIT_EXCEEDED");
      }
      normalized.push({ key, count: c });
    }
    if (args.mode === "replace") {
      const rows = await ctx.db
        .query("albumStickers")
        .withIndex("by_album", (q) => q.eq("albumId", album._id))
        .collect();
      for (const r of rows) {
        await ctx.db.delete("albumStickers", r._id);
      }
      await ctx.db.patch("albums", album._id, {
        ownedCount: 0,
        duplicateCount: 0,
        updatedAt: Date.now(),
      });
      for (const { key, count } of normalized) {
        if (count <= 0) continue;
        await setStickerCountAbsolute(
          ctx,
          album._id,
          album.templateId,
          key,
          count,
        );
      }
      return null;
    }
    for (const { key, count: target } of normalized) {
      const cur = await getStickerCount(ctx, album._id, key);
      const next = sanitizeCount(Math.max(cur, target));
      await setStickerCountAbsolute(
        ctx,
        album._id,
        album.templateId,
        key,
        next,
      );
    }
    return null;
  },
});
