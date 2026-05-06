import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  normalizeAlbumCode,
  normalizeWriteKey,
  verifyWriteKey,
} from "./access";
import { appError } from "./errors";

export async function requireAlbumByCode(
  ctx: QueryCtx | MutationCtx,
  code: string,
): Promise<Doc<"albums">> {
  const normalized = normalizeAlbumCode(code);
  const album = await ctx.db
    .query("albums")
    .withIndex("by_code", (q) => q.eq("code", normalized))
    .unique();
  if (!album) {
    throw appError("ALBUM_NOT_FOUND");
  }
  return album;
}

export async function requireWriteAccess(
  ctx: QueryCtx | MutationCtx,
  code: string,
  writeKey: string,
): Promise<Doc<"albums">> {
  const album = await requireAlbumByCode(ctx, code);
  const ok = await verifyWriteKey(
    normalizeWriteKey(writeKey),
    album.keySalt,
    album.writeKeyHash,
  );
  if (!ok) {
    throw appError("INVALID_WRITE_KEY");
  }
  return album;
}

export type PublicAlbumShape = {
  code: string;
  templateId: string;
  name: string;
  total: number;
  ownedCount: number;
  duplicateCount: number;
  completionPercentage: number;
  compareEnabled: boolean;
};

export function toPublicAlbumFields(
  album: Doc<"albums">,
  total: number,
): PublicAlbumShape {
  const pct = total <= 0 ? 0 : Math.round((album.ownedCount / total) * 100);
  return {
    code: album.code,
    templateId: album.templateId,
    name: album.name,
    total,
    ownedCount: album.ownedCount,
    duplicateCount: album.duplicateCount,
    completionPercentage: pct,
    compareEnabled: album.compareEnabled,
  };
}
