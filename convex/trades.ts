import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getStickerCount, setStickerCountAbsolute } from "./lib/albumStickers";
import { requireAlbumByCode, requireWriteAccess } from "./lib/albumAccess";
import { appError } from "./lib/errors";
import { stickerExists } from "./lib/templates";

function assertUniqueKeys(keys: string[]): void {
  const s = new Set(keys);
  if (s.size !== keys.length) {
    throw appError("INVALID_STICKER");
  }
  for (const k of keys) {
    if (!k.trim()) {
      throw appError("INVALID_STICKER");
    }
  }
}

const tradeSummaryValidator = v.object({
  tradeId: v.string(),
  fromAlbumId: v.string(),
  toAlbumId: v.string(),
  fromAlbumCode: v.string(),
  toAlbumCode: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("declined"),
    v.literal("cancelled"),
    v.literal("completed"),
  ),
  fromGives: v.array(v.string()),
  toGives: v.array(v.string()),
  note: v.optional(v.string()),
  createdAt: v.number(),
});

export const createTradeOffer = mutation({
  args: {
    fromCode: v.string(),
    fromWriteKey: v.string(),
    toCode: v.string(),
    fromGives: v.array(v.string()),
    toGives: v.array(v.string()),
    note: v.optional(v.string()),
  },
  returns: v.object({
    tradeId: v.string(),
    status: v.literal("pending"),
  }),
  handler: async (ctx, args) => {
    const from = await requireWriteAccess(ctx, args.fromCode, args.fromWriteKey);
    const to = await requireAlbumByCode(ctx, args.toCode);
    if (from._id === to._id) {
      throw appError("ALBUM_NOT_FOUND");
    }
    if (!to.compareEnabled) {
      throw appError("COMPARE_DISABLED");
    }
    if (from.templateId !== to.templateId) {
      throw appError("INVALID_STICKER");
    }
    assertUniqueKeys(args.fromGives);
    assertUniqueKeys(args.toGives);
    if (args.fromGives.length === 0 && args.toGives.length === 0) {
      throw appError("INVALID_STICKER");
    }
    for (const k of [...args.fromGives, ...args.toGives]) {
      if (!stickerExists(from.templateId, k)) {
        throw appError("INVALID_STICKER");
      }
    }
    for (const k of args.fromGives) {
      const c = await getStickerCount(ctx, from._id, k);
      if (c < 2) {
        throw appError("INVALID_STICKER");
      }
    }
    for (const k of args.toGives) {
      const c = await getStickerCount(ctx, to._id, k);
      if (c < 2) {
        throw appError("INVALID_STICKER");
      }
    }
    const now = Date.now();
    const id = await ctx.db.insert("tradeOffers", {
      fromAlbumId: from._id,
      toAlbumId: to._id,
      status: "pending",
      fromGives: args.fromGives,
      toGives: args.toGives,
      note: args.note,
      createdAt: now,
      updatedAt: now,
    });
    return { tradeId: id, status: "pending" as const };
  },
});

export const listTradesForAlbum = query({
  args: {
    code: v.string(),
    writeKey: v.string(),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("declined"),
        v.literal("cancelled"),
        v.literal("completed"),
      ),
    ),
  },
  returns: v.array(tradeSummaryValidator),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
    const fromTrades = await ctx.db
      .query("tradeOffers")
      .withIndex("by_from_status", (q) => q.eq("fromAlbumId", album._id))
      .collect();
    const toTrades = await ctx.db
      .query("tradeOffers")
      .withIndex("by_to_status", (q) => q.eq("toAlbumId", album._id))
      .collect();
    const byId = new Map<string, (typeof fromTrades)[0]>();
    for (const t of fromTrades) {
      byId.set(t._id, t);
    }
    for (const t of toTrades) {
      byId.set(t._id, t);
    }
    const all = [...byId.values()];
    const filtered = args.status
      ? all.filter((t) => t.status === args.status)
      : all;
    const albumCache = new Map<string, string>();
    async function codeFor(id: typeof album._id): Promise<string> {
      const key = id;
      const hit = albumCache.get(key);
      if (hit) return hit;
      const doc = await ctx.db.get("albums", id);
      const c = doc?.code ?? "";
      albumCache.set(key, c);
      return c;
    }
    const out = [];
    for (const t of filtered) {
      out.push({
        tradeId: t._id,
        fromAlbumId: t.fromAlbumId,
        toAlbumId: t.toAlbumId,
        fromAlbumCode: await codeFor(t.fromAlbumId),
        toAlbumCode: await codeFor(t.toAlbumId),
        status: t.status,
        fromGives: t.fromGives,
        toGives: t.toGives,
        note: t.note,
        createdAt: t.createdAt,
      });
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  },
});

export const acceptTradeOffer = mutation({
  args: {
    code: v.string(),
    writeKey: v.string(),
    tradeId: v.id("tradeOffers"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const toAlbum = await requireWriteAccess(ctx, args.code, args.writeKey);
    const trade = await ctx.db.get("tradeOffers", args.tradeId);
    if (!trade) {
      throw appError("TRADE_NOT_FOUND");
    }
    if (trade.toAlbumId !== toAlbum._id) {
      throw appError("TRADE_NOT_FOUND");
    }
    if (trade.status !== "pending") {
      throw appError("TRADE_STALE");
    }
    const fromAlbumDoc = await ctx.db.get("albums", trade.fromAlbumId);
    if (!fromAlbumDoc) {
      throw appError("ALBUM_NOT_FOUND");
    }
    for (const k of trade.fromGives) {
      const c = await getStickerCount(ctx, trade.fromAlbumId, k);
      if (c < 2) {
        throw appError("TRADE_STALE");
      }
    }
    for (const k of trade.toGives) {
      const c = await getStickerCount(ctx, trade.toAlbumId, k);
      if (c < 2) {
        throw appError("TRADE_STALE");
      }
    }
    for (const k of trade.fromGives) {
      const c = await getStickerCount(ctx, trade.fromAlbumId, k);
      await setStickerCountAbsolute(
        ctx,
        trade.fromAlbumId,
        fromAlbumDoc.templateId,
        k,
        c - 1,
      );
      const ct = await getStickerCount(ctx, trade.toAlbumId, k);
      await setStickerCountAbsolute(
        ctx,
        trade.toAlbumId,
        toAlbum.templateId,
        k,
        ct + 1,
      );
    }
    for (const k of trade.toGives) {
      const c = await getStickerCount(ctx, trade.toAlbumId, k);
      await setStickerCountAbsolute(
        ctx,
        trade.toAlbumId,
        toAlbum.templateId,
        k,
        c - 1,
      );
      const cf = await getStickerCount(ctx, trade.fromAlbumId, k);
      await setStickerCountAbsolute(
        ctx,
        trade.fromAlbumId,
        fromAlbumDoc.templateId,
        k,
        cf + 1,
      );
    }
    const now = Date.now();
    await ctx.db.patch("tradeOffers", trade._id, {
      status: "completed",
      updatedAt: now,
      completedAt: now,
      acceptedAt: now,
    });
    return null;
  },
});

export const cancelTradeOffer = mutation({
  args: {
    code: v.string(),
    writeKey: v.string(),
    tradeId: v.id("tradeOffers"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
    const trade = await ctx.db.get("tradeOffers", args.tradeId);
    if (!trade) {
      throw appError("TRADE_NOT_FOUND");
    }
    if (trade.status !== "pending") {
      throw appError("TRADE_STALE");
    }
    const now = Date.now();
    if (trade.fromAlbumId === album._id) {
      await ctx.db.patch("tradeOffers", trade._id, {
        status: "cancelled",
        updatedAt: now,
      });
      return null;
    }
    if (trade.toAlbumId === album._id) {
      await ctx.db.patch("tradeOffers", trade._id, {
        status: "declined",
        updatedAt: now,
      });
      return null;
    }
    throw appError("TRADE_NOT_FOUND");
  },
});
