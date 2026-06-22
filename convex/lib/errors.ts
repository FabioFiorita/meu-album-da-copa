import { ConvexError } from "convex/values";

export const APP_ERROR_CODES = [
  "ALBUM_NOT_FOUND",
  "INVALID_WRITE_KEY",
  "INVALID_STICKER",
  "COMPARE_DISABLED",
  "COUNT_LIMIT_EXCEEDED",
  "INVALID_SHARE_PAYLOAD",
  "CODE_ALLOCATION_FAILED",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export function appError(code: AppErrorCode): never {
  throw new ConvexError({ code });
}
