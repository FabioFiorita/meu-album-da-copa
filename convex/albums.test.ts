/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { WC_2026_TEMPLATE } from "./lib/templates";

const modules = import.meta.glob("./**/*.ts");

async function expectAppError(
  promise: Promise<unknown>,
  code: string,
): Promise<void> {
  try {
    await promise;
  } catch (e) {
    expect((e as ConvexError<{ code: string }>).data?.code).toBe(code);
    return;
  }
  throw new Error(`expected ConvexError "${code}" but the call resolved`);
}

describe("albums.create", () => {
  test("returns a code, writeKey and full access code", async () => {
    const t = convexTest(schema, modules);
    const created = await t.mutation(api.albums.create, {});
    expect(created.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/);
    expect(created.writeKey).toHaveLength(24);
    expect(created.fullAccessCode).toBe(
      `FIGUS_ALBUM_V1.${created.code}.${created.writeKey}`,
    );
    expect(created.total).toBe(WC_2026_TEMPLATE.total);
    expect(created.ownedCount).toBe(0);
    expect(created.duplicateCount).toBe(0);
  });

  test("two albums get distinct codes", async () => {
    const t = convexTest(schema, modules);
    const a = await t.mutation(api.albums.create, {});
    const b = await t.mutation(api.albums.create, {});
    expect(a.code).not.toBe(b.code);
  });
});

describe("albums.getPrivateSnapshot access control", () => {
  test("correct write key returns the snapshot", async () => {
    const t = convexTest(schema, modules);
    const { code, writeKey } = await t.mutation(api.albums.create, {});
    const snap = await t.query(api.albums.getPrivateSnapshot, {
      code,
      writeKey,
    });
    expect(snap.album.code).toBe(code);
    expect(snap.album.total).toBe(WC_2026_TEMPLATE.total);
    expect(snap.album.ownedCount).toBe(0);
    expect(snap.album.completionPercentage).toBe(0);
    expect(snap.sections.length).toBe(WC_2026_TEMPLATE.sections.length);
  });

  test("wrong write key throws INVALID_WRITE_KEY", async () => {
    const t = convexTest(schema, modules);
    const { code } = await t.mutation(api.albums.create, {});
    await expectAppError(
      t.query(api.albums.getPrivateSnapshot, {
        code,
        writeKey: "TOTALLYWRONGWRITEKEY1234",
      }),
      "INVALID_WRITE_KEY",
    );
  });

  test("unknown code throws ALBUM_NOT_FOUND", async () => {
    const t = convexTest(schema, modules);
    await expectAppError(
      t.query(api.albums.getPrivateSnapshot, {
        code: "ZZZZ-ZZZZ-ZZ",
        writeKey: "ANYWRITEKEYVALUE12345678",
      }),
      "ALBUM_NOT_FOUND",
    );
  });
});

describe("albums.resetAlbum", () => {
  test("zeroes counters and clears albumStickers rows", async () => {
    const t = convexTest(schema, modules);
    const { code, writeKey } = await t.mutation(api.albums.create, {});
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: "BRA:1",
      count: 3,
    });
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: "CC:2",
      count: 1,
    });

    const before = await t.query(api.albums.getPrivateSnapshot, {
      code,
      writeKey,
    });
    expect(before.album.ownedCount).toBe(2);
    expect(before.album.duplicateCount).toBe(2);

    await t.mutation(api.albums.resetAlbum, { code, writeKey });

    const after = await t.query(api.albums.getPrivateSnapshot, {
      code,
      writeKey,
    });
    expect(after.album.ownedCount).toBe(0);
    expect(after.album.duplicateCount).toBe(0);
    expect(after.stickers).toHaveLength(0);

    const rows = await t.run(async (ctx) => {
      const album = await ctx.db
        .query("albums")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      return await ctx.db
        .query("albumStickers")
        .withIndex("by_album", (q) => q.eq("albumId", album!._id))
        .collect();
    });
    expect(rows).toHaveLength(0);
  });
});
