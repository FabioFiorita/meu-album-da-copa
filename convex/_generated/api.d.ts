/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as albums from "../albums.js";
import type * as compare from "../compare.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_albumAccess from "../lib/albumAccess.js";
import type * as lib_albumStickers from "../lib/albumStickers.js";
import type * as lib_counts from "../lib/counts.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_sharePayloads from "../lib/sharePayloads.js";
import type * as lib_stickerKeys from "../lib/stickerKeys.js";
import type * as lib_templates from "../lib/templates.js";
import type * as stickers from "../stickers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  albums: typeof albums;
  compare: typeof compare;
  "lib/access": typeof lib_access;
  "lib/albumAccess": typeof lib_albumAccess;
  "lib/albumStickers": typeof lib_albumStickers;
  "lib/counts": typeof lib_counts;
  "lib/errors": typeof lib_errors;
  "lib/sharePayloads": typeof lib_sharePayloads;
  "lib/stickerKeys": typeof lib_stickerKeys;
  "lib/templates": typeof lib_templates;
  stickers: typeof stickers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
