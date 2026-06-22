/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type Harness = TestConvex<typeof schema>;

async function makeAlbum(t: Harness) {
  const { code, writeKey } = await t.mutation(api.albums.create, {});
  return { code, writeKey };
}

async function readAlbum(t: Harness, code: string): Promise<Doc<"albums">> {
  const album = await t.run(async (ctx) => {
    return await ctx.db
      .query("albums")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
  });
  expect(album).not.toBeNull();
  return album!;
}

async function readRows(
  t: Harness,
  code: string,
): Promise<Doc<"albumStickers">[]> {
  return await t.run(async (ctx) => {
    const album = await ctx.db
      .query("albums")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    return await ctx.db
      .query("albumStickers")
      .withIndex("by_album", (q) => q.eq("albumId", album!._id))
      .collect();
  });
}

// The denormalized album.ownedCount / album.duplicateCount must always agree
// with the underlying albumStickers rows. This is the core safety net around
// setStickerCountAbsolute + counts.ts.
async function expectInvariant(t: Harness, code: string) {
  const album = await readAlbum(t, code);
  const rows = await readRows(t, code);
  const ownedExpected = rows.filter((r) => r.count >= 1).length;
  const dupExpected = rows.reduce(
    (sum, r) => sum + Math.max(0, r.count - 1),
    0,
  );
  // count===0 rows are deleted, so every stored row should be owned.
  expect(rows.every((r) => r.count >= 1)).toBe(true);
  expect(album.ownedCount).toBe(ownedExpected);
  expect(album.duplicateCount).toBe(dupExpected);
}

describe("stickers.addCopies", () => {
  test("clamps at 0 (cannot go negative)", async () => {
    const t = convexTest(schema, modules);
    const { code, writeKey } = await makeAlbum(t);
    await t.mutation(api.stickers.addCopies, {
      code,
      writeKey,
      stickerKey: "BRA:1",
      delta: -5,
    });
    const album = await readAlbum(t, code);
    expect(album.ownedCount).toBe(0);
    expect(album.duplicateCount).toBe(0);
    expect(await readRows(t, code)).toHaveLength(0);
  });

  test("clamps at COUNT_MAX (99)", async () => {
    const t = convexTest(schema, modules);
    const { code, writeKey } = await makeAlbum(t);
    await t.mutation(api.stickers.addCopies, {
      code,
      writeKey,
      stickerKey: "BRA:1",
      delta: 250,
    });
    const rows = await readRows(t, code);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.count).toBe(99);
    const album = await readAlbum(t, code);
    expect(album.ownedCount).toBe(1);
    expect(album.duplicateCount).toBe(98);
    await expectInvariant(t, code);
  });

  test("accumulates positive deltas", async () => {
    const t = convexTest(schema, modules);
    const { code, writeKey } = await makeAlbum(t);
    await t.mutation(api.stickers.addCopies, {
      code,
      writeKey,
      stickerKey: "BRA:1",
      delta: 1,
    });
    await t.mutation(api.stickers.addCopies, {
      code,
      writeKey,
      stickerKey: "BRA:1",
      delta: 2,
    });
    const rows = await readRows(t, code);
    expect(rows[0]!.count).toBe(3);
    await expectInvariant(t, code);
  });
});

describe("stickers.setCount", () => {
  test("sets an absolute value", async () => {
    const t = convexTest(schema, modules);
    const { code, writeKey } = await makeAlbum(t);
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: "BRA:1",
      count: 4,
    });
    expect((await readRows(t, code))[0]!.count).toBe(4);
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: "BRA:1",
      count: 1,
    });
    expect((await readRows(t, code))[0]!.count).toBe(1);
    await expectInvariant(t, code);
  });

  test("clamps absolute value high and low", async () => {
    const t = convexTest(schema, modules);
    const { code, writeKey } = await makeAlbum(t);
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: "BRA:1",
      count: 150,
    });
    expect((await readRows(t, code))[0]!.count).toBe(99);
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: "BRA:1",
      count: -3,
    });
    // count 0 deletes the row
    expect(await readRows(t, code)).toHaveLength(0);
    await expectInvariant(t, code);
  });
});

describe("stickers.markQuick", () => {
  test("owned makes count >= 1 without lowering a higher count", async () => {
    const t = convexTest(schema, modules);
    const { code, writeKey } = await makeAlbum(t);
    // 0 -> 1
    await t.mutation(api.stickers.markQuick, {
      code,
      writeKey,
      sectionId: "BRA",
      number: "1",
      mode: "owned",
    });
    expect((await readRows(t, code))[0]!.count).toBe(1);

    // bump to 5, then markQuick owned must NOT lower it
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: "BRA:1",
      count: 5,
    });
    await t.mutation(api.stickers.markQuick, {
      code,
      writeKey,
      sectionId: "BRA",
      number: "1",
      mode: "owned",
    });
    expect((await readRows(t, code))[0]!.count).toBe(5);
    await expectInvariant(t, code);
  });

  test("duplicate goes 0->2, 1->2, then increments", async () => {
    const t = convexTest(schema, modules);
    const { code, writeKey } = await makeAlbum(t);

    // 0 -> 2
    await t.mutation(api.stickers.markQuick, {
      code,
      writeKey,
      sectionId: "BRA",
      number: "1",
      mode: "duplicate",
    });
    expect((await readRows(t, code))[0]!.count).toBe(2);

    // 2 -> 3 (increments)
    await t.mutation(api.stickers.markQuick, {
      code,
      writeKey,
      sectionId: "BRA",
      number: "1",
      mode: "duplicate",
    });
    expect((await readRows(t, code))[0]!.count).toBe(3);

    // 1 -> 2 on a fresh sticker
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: "BRA:2",
      count: 1,
    });
    await t.mutation(api.stickers.markQuick, {
      code,
      writeKey,
      sectionId: "BRA",
      number: "2",
      mode: "duplicate",
    });
    const bra2 = (await readRows(t, code)).find((r) => r.stickerKey === "BRA:2");
    expect(bra2!.count).toBe(2);
    await expectInvariant(t, code);
  });
});

describe("denormalized counter invariant on tricky transitions", () => {
  test("0->1 owned +1, 1->2 dup +1, 2->0 owned -1 dup -1 row deleted", async () => {
    const t = convexTest(schema, modules);
    const { code, writeKey } = await makeAlbum(t);
    const key = "BRA:1";

    // 0 -> 1: ownedCount +1
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: key,
      count: 1,
    });
    let album = await readAlbum(t, code);
    expect(album.ownedCount).toBe(1);
    expect(album.duplicateCount).toBe(0);
    await expectInvariant(t, code);

    // 1 -> 2: duplicateCount +1
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: key,
      count: 2,
    });
    album = await readAlbum(t, code);
    expect(album.ownedCount).toBe(1);
    expect(album.duplicateCount).toBe(1);
    await expectInvariant(t, code);

    // 2 -> 0: ownedCount -1, duplicateCount -1, row removed
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: key,
      count: 0,
    });
    album = await readAlbum(t, code);
    expect(album.ownedCount).toBe(0);
    expect(album.duplicateCount).toBe(0);
    expect(await readRows(t, code)).toHaveLength(0);
    await expectInvariant(t, code);
  });

  test("invariant holds after a mixed operation sequence", async () => {
    const t = convexTest(schema, modules);
    const { code, writeKey } = await makeAlbum(t);

    await t.mutation(api.stickers.markQuick, {
      code,
      writeKey,
      sectionId: "BRA",
      number: "1",
      mode: "owned",
    });
    await t.mutation(api.stickers.markQuick, {
      code,
      writeKey,
      sectionId: "BRA",
      number: "2",
      mode: "duplicate",
    });
    await t.mutation(api.stickers.addCopies, {
      code,
      writeKey,
      stickerKey: "CC:3",
      delta: 3,
    });
    await t.mutation(api.stickers.setCount, {
      code,
      writeKey,
      stickerKey: "FWC:00",
      count: 5,
    });
    await t.mutation(api.stickers.markQuick, {
      code,
      writeKey,
      sectionId: "BRA",
      number: "1",
      mode: "owned",
    });

    await expectInvariant(t, code);

    // Cross-check the snapshot reads the same denormalized counters.
    const snap = await t.query(api.albums.getPrivateSnapshot, {
      code,
      writeKey,
    });
    const album = await readAlbum(t, code);
    expect(snap.album.ownedCount).toBe(album.ownedCount);
    expect(snap.album.duplicateCount).toBe(album.duplicateCount);
    // 4 distinct owned stickers: BRA:1, BRA:2, CC:3, FWC:00
    expect(album.ownedCount).toBe(4);
    // dups: BRA:2(1) + CC:3(2) + FWC:00(4) = 7
    expect(album.duplicateCount).toBe(7);
  });
});
