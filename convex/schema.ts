import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  albums: defineTable({
    templateId: v.string(),
    name: v.string(),
    code: v.string(),
    writeKeyHash: v.string(),
    keySalt: v.string(),
    compareEnabled: v.boolean(),
    ownedCount: v.number(),
    duplicateCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),

  albumStickers: defineTable({
    albumId: v.id("albums"),
    templateId: v.string(),
    sectionId: v.string(),
    stickerNumber: v.string(),
    stickerKey: v.string(),
    count: v.number(),
    updatedAt: v.number(),
  })
    .index("by_album", ["albumId"])
    .index("by_album_section", ["albumId", "sectionId"])
    .index("by_album_sticker", ["albumId", "stickerKey"]),

  tradeOffers: defineTable({
    fromAlbumId: v.id("albums"),
    toAlbumId: v.id("albums"),
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
    updatedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_from_status", ["fromAlbumId", "status"])
    .index("by_to_status", ["toAlbumId", "status"]),
});
