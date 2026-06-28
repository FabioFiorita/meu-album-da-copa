import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  createAlbumCode,
  createFullAccessCode,
  createKeySalt,
  createWriteKey,
  hashWriteKey,
} from "./lib/access";
import { requireAlbumByCode, requireWriteAccess, toPublicAlbumFields } from "./lib/albumAccess";
import { appError } from "./lib/errors";
import { WC_2026_TEMPLATE } from "./lib/templates";
import type { AlbumTemplateId } from "./lib/templates";

const DEFAULT_TEMPLATE: AlbumTemplateId = "wc2026";

function templateTotal(templateId: string): number {
  if (templateId === "wc2026") return WC_2026_TEMPLATE.total;
  return WC_2026_TEMPLATE.total;
}

const publicAlbumValidator = v.object({
  code: v.string(),
  templateId: v.string(),
  name: v.string(),
  total: v.number(),
  ownedCount: v.number(),
  duplicateCount: v.number(),
  completionPercentage: v.number(),
  compareEnabled: v.boolean(),
});

const sectionSummaryValidator = v.object({
  id: v.string(),
  title: v.string(),
  emoji: v.optional(v.string()),
  total: v.number(),
  ownedCount: v.number(),
  duplicateCount: v.number(),
});

const stickerRowValidator = v.object({
  key: v.string(),
  sectionId: v.string(),
  number: v.string(),
  count: v.number(),
  duplicateCount: v.number(),
});

export const create = mutation({
  args: {
    name: v.optional(v.string()),
    templateId: v.optional(v.literal("wc2026")),
  },
  returns: v.object({
    code: v.string(),
    writeKey: v.string(),
    fullAccessCode: v.string(),
    templateId: v.string(),
    name: v.string(),
    total: v.number(),
    ownedCount: v.number(),
    duplicateCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const templateId = args.templateId ?? DEFAULT_TEMPLATE;
    const total = templateTotal(templateId);
    const name =
      args.name?.trim() ||
      WC_2026_TEMPLATE.title;
    let code = "";
    let attempts = 0;
    let allocated = false;
    while (attempts < 30) {
      attempts++;
      code = createAlbumCode();
      const taken = await ctx.db
        .query("albums")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!taken) {
        allocated = true;
        break;
      }
    }
    if (!allocated) {
      throw appError("CODE_ALLOCATION_FAILED");
    }
    const writeKey = createWriteKey();
    const salt = createKeySalt();
    const writeKeyHash = await hashWriteKey(writeKey, salt);
    const now = Date.now();
    await ctx.db.insert("albums", {
      templateId,
      name,
      code,
      writeKeyHash,
      keySalt: salt,
      compareEnabled: true,
      ownedCount: 0,
      duplicateCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return {
      code,
      writeKey,
      fullAccessCode: createFullAccessCode(code, writeKey),
      templateId,
      name,
      total,
      ownedCount: 0,
      duplicateCount: 0,
    };
  },
});

export const getPrivateSnapshot = query({
  args: {
    code: v.string(),
    writeKey: v.string(),
  },
  returns: v.object({
    album: publicAlbumValidator,
    sections: v.array(sectionSummaryValidator),
    stickers: v.array(stickerRowValidator),
  }),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
    const template =
      album.templateId === "wc2026" ? WC_2026_TEMPLATE : WC_2026_TEMPLATE;
    const total = template.total;
    const rows = await ctx.db
      .query("albumStickers")
      .withIndex("by_album", (q) => q.eq("albumId", album._id))
      .collect();
    const byKey = new Map<string, number>();
    for (const r of rows) {
      byKey.set(r.stickerKey, r.count);
    }
    const sections = template.sections.map((sec) => {
      let owned = 0;
      let dups = 0;
      for (const st of sec.stickers) {
        const c = byKey.get(st.key) ?? 0;
        if (c >= 1) owned += 1;
        if (c > 1) dups += c - 1;
      }
      return {
        id: sec.id,
        title: sec.title,
        emoji: sec.emoji,
        total: sec.total,
        ownedCount: owned,
        duplicateCount: dups,
      };
    });
    const stickers = rows
      .filter((r) => r.count > 0)
      .map((r) => ({
        key: r.stickerKey,
        sectionId: r.sectionId,
        number: r.stickerNumber,
        count: r.count,
        duplicateCount: Math.max(0, r.count - 1),
      }));
    return {
      album: toPublicAlbumFields(album, total),
      sections,
      stickers,
    };
  },
});

export const getPublicCompareSnapshot = query({
  args: { code: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      code: v.string(),
      templateId: v.string(),
      name: v.string(),
      total: v.number(),
      ownedCount: v.number(),
      duplicateCount: v.number(),
      missingKeys: v.array(v.string()),
      duplicateKeys: v.array(v.string()),
      duplicateQuantities: v.array(
        v.object({ key: v.string(), quantity: v.number() }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const album = await requireAlbumByCode(ctx, args.code);
    if (!album.compareEnabled) {
      return null;
    }
    const template =
      album.templateId === "wc2026" ? WC_2026_TEMPLATE : WC_2026_TEMPLATE;
    const total = template.total;
    const rows = await ctx.db
      .query("albumStickers")
      .withIndex("by_album", (q) => q.eq("albumId", album._id))
      .collect();
    const byKey = new Map<string, number>();
    for (const r of rows) {
      byKey.set(r.stickerKey, r.count);
    }
    const missingKeys: string[] = [];
    const duplicateKeys: string[] = [];
    const duplicateQuantities: Array<{ key: string; quantity: number }> = [];
    for (const sec of template.sections) {
      for (const st of sec.stickers) {
        const c = byKey.get(st.key) ?? 0;
        if (c < 1) missingKeys.push(st.key);
        if (c >= 2) {
          duplicateKeys.push(st.key);
          duplicateQuantities.push({ key: st.key, quantity: c - 1 });
        }
      }
    }
    return {
      code: album.code,
      templateId: album.templateId,
      name: album.name,
      total,
      ownedCount: album.ownedCount,
      duplicateCount: album.duplicateCount,
      missingKeys,
      duplicateKeys,
      duplicateQuantities,
    };
  },
});

export const setCompareEnabled = mutation({
  args: {
    code: v.string(),
    writeKey: v.string(),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
    await ctx.db.patch("albums", album._id, {
      compareEnabled: args.enabled,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const rename = mutation({
  args: {
    code: v.string(),
    writeKey: v.string(),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
    await ctx.db.patch("albums", album._id, {
      name: args.name.trim() || album.name,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const rotateWriteKey = mutation({
  args: {
    code: v.string(),
    writeKey: v.string(),
  },
  returns: v.object({
    code: v.string(),
    writeKey: v.string(),
    fullAccessCode: v.string(),
  }),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
    const newKey = createWriteKey();
    const salt = createKeySalt();
    const writeKeyHash = await hashWriteKey(newKey, salt);
    await ctx.db.patch("albums", album._id, {
      writeKeyHash,
      keySalt: salt,
      updatedAt: Date.now(),
    });
    return {
      code: album.code,
      writeKey: newKey,
      fullAccessCode: createFullAccessCode(album.code, newKey),
    };
  },
});

export const resetAlbum = mutation({
  args: { code: v.string(), writeKey: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const album = await requireWriteAccess(ctx, args.code, args.writeKey);
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
    return null;
  },
});
