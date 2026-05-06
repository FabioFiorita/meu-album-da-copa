import { ConvexError } from "convex/values";

export const APP_ERROR_CODES = [
  "ALBUM_NOT_FOUND",
  "INVALID_WRITE_KEY",
  "INVALID_STICKER",
  "COMPARE_DISABLED",
  "TRADE_NOT_FOUND",
  "TRADE_STALE",
  "COUNT_LIMIT_EXCEEDED",
  "INVALID_SHARE_PAYLOAD",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export function appError(code: AppErrorCode): never {
  throw new ConvexError({ code });
}
