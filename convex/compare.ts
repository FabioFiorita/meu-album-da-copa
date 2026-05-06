import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAlbumByCode, requireWriteAccess } from "./lib/albumAccess";
import { getStickerCount } from "./lib/albumStickers";
import { decodeMissingPayloadV1 } from "./lib/sharePayloads";
import { appError } from "./lib/errors";
import { assertStickerExists, stickerExists } from "./lib/templates";

const giveRowValidator = v.object({
  key: v.string(),
  sectionId: v.string(),
  number: v.string(),
  myDuplicateQuantity: v.number(),
  theirDuplicateQuantity: v.number(),
});

export const compareWithAlbum = query({
  args: {
    myCode: v.string(),
    myWriteKey: v.string(),
    otherCode: v.string(),
  },
  returns: v.object({
    otherAlbum: v.object({
      code: v.string(),
      name: v.string(),
      ownedCount: v.number(),
      duplicateCount: v.number(),
    }),
    iCanGive: v.array(giveRowValidator),
    theyCanGiveMe: v.array(giveRowValidator),
    balancedSuggestion: v.object({
      fromMe: v.array(v.string()),
      fromOther: v.array(v.string()),
    }),
  }),
  handler: async (ctx, args) => {
    const mine = await requireWriteAccess(ctx, args.myCode, args.myWriteKey);
    const other = await requireAlbumByCode(ctx, args.otherCode);
    if (mine._id === other._id) {
      throw appError("ALBUM_NOT_FOUND");
    }
    if (!other.compareEnabled) {
      throw appError("COMPARE_DISABLED");
    }
    if (other.templateId !== mine.templateId) {
      throw appError("INVALID_STICKER");
    }
    const allRowsMine = await ctx.db
      .query("albumStickers")
      .withIndex("by_album", (q) => q.eq("albumId", mine._id))
      .collect();
    const allRowsOther = await ctx.db
      .query("albumStickers")
      .withIndex("by_album", (q) => q.eq("albumId", other._id))
      .collect();
    const mineMap = new Map<string, number>();
    for (const r of allRowsMine) {
      mineMap.set(r.stickerKey, r.count);
    }
    const otherMap = new Map<string, number>();
    for (const r of allRowsOther) {
      otherMap.set(r.stickerKey, r.count);
    }
    const keys = new Set([...mineMap.keys(), ...otherMap.keys()]);
    const iCanGive: Array<{
      key: string;
      sectionId: string;
      number: string;
      myDuplicateQuantity: number;
      theirDuplicateQuantity: number;
    }> = [];
    const theyCanGiveMe: Array<{
      key: string;
      sectionId: string;
      number: string;
      myDuplicateQuantity: number;
      theirDuplicateQuantity: number;
    }> = [];
    for (const key of keys) {
      if (!stickerExists(mine.templateId, key)) continue;
      const st = assertStickerExists(mine.templateId, key);
      const mc = mineMap.get(key) ?? 0;
      const oc = otherMap.get(key) ?? 0;
      if (mc >= 2 && oc < 1) {
        iCanGive.push({
          key,
          sectionId: st.sectionId,
          number: st.number,
          myDuplicateQuantity: mc - 1,
          theirDuplicateQuantity: Math.max(0, oc - 1),
        });
      }
      if (oc >= 2 && mc < 1) {
        theyCanGiveMe.push({
          key,
          sectionId: st.sectionId,
          number: st.number,
          myDuplicateQuantity: Math.max(0, mc - 1),
          theirDuplicateQuantity: oc - 1,
        });
      }
    }
    const n = Math.min(iCanGive.length, theyCanGiveMe.length);
    const balancedSuggestion = {
      fromMe: iCanGive.slice(0, n).map((x) => x.key),
      fromOther: theyCanGiveMe.slice(0, n).map((x) => x.key),
    };
    return {
      otherAlbum: {
        code: other.code,
        name: other.name,
        ownedCount: other.ownedCount,
        duplicateCount: other.duplicateCount,
      },
      iCanGive,
      theyCanGiveMe,
      balancedSuggestion,
    };
  },
});

export const compareWithMissingPayload = query({
  args: {
    myCode: v.string(),
    myWriteKey: v.string(),
    payload: v.string(),
  },
  returns: v.object({
    source: v.literal("payload"),
    iCanGive: v.array(giveRowValidator),
  }),
  handler: async (ctx, args) => {
    const mine = await requireWriteAccess(ctx, args.myCode, args.myWriteKey);
    let decoded: ReturnType<typeof decodeMissingPayloadV1>;
    try {
      decoded = decodeMissingPayloadV1(args.payload);
    } catch {
      throw appError("INVALID_SHARE_PAYLOAD");
    }
    if (decoded.templateId !== mine.templateId) {
      throw appError("INVALID_SHARE_PAYLOAD");
    }
    const missing = new Set(decoded.missingKeys);
    const iCanGive: Array<{
      key: string;
      sectionId: string;
      number: string;
      myDuplicateQuantity: number;
      theirDuplicateQuantity: number;
    }> = [];
    for (const key of missing) {
      if (!stickerExists(mine.templateId, key)) continue;
      const st = assertStickerExists(mine.templateId, key);
      const mc = await getStickerCount(ctx, mine._id, key);
      if (mc >= 2) {
        iCanGive.push({
          key,
          sectionId: st.sectionId,
          number: st.number,
          myDuplicateQuantity: mc - 1,
          theirDuplicateQuantity: 0,
        });
      }
    }
    return { source: "payload" as const, iCanGive };
  },
});
