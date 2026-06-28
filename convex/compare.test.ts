/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { WC_2026_TEMPLATE } from "./lib/templates";

const modules = import.meta.glob("./**/*.ts");

type Harness = TestConvex<typeof schema>;

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

// Album A is "mine"; Album B is "theirs". B has a duplicate of BRA:1 that A is
// missing; A has a duplicate of CC:3 that B is missing.
async function twoAlbums(t: Harness) {
  const mine = await t.mutation(api.albums.create, {});
  const other = await t.mutation(api.albums.create, {});
  await t.mutation(api.stickers.setCount, {
    code: other.code,
    writeKey: other.writeKey,
    stickerKey: "BRA:1",
    count: 2,
  });
  await t.mutation(api.stickers.setCount, {
    code: mine.code,
    writeKey: mine.writeKey,
    stickerKey: "CC:3",
    count: 2,
  });
  return { mine, other };
}

describe("compare.compareWithAlbum", () => {
  test("returns the expected give/receive diff", async () => {
    const t = convexTest(schema, modules);
    const { mine, other } = await twoAlbums(t);
    const result = await t.query(api.compare.compareWithAlbum, {
      myCode: mine.code,
      myWriteKey: mine.writeKey,
      otherCode: other.code,
    });

    expect(result.otherAlbum.code).toBe(other.code);
    expect(result.iCanGive.map((r) => r.key)).toEqual(["CC:3"]);
    expect(result.theyCanGiveMe.map((r) => r.key)).toEqual(["BRA:1"]);
    expect(result.iCanGive[0]!.myDuplicateQuantity).toBe(1);
    expect(result.theyCanGiveMe[0]!.theirDuplicateQuantity).toBe(1);
    expect(result.balancedSuggestion.fromMe).toEqual(["CC:3"]);
    expect(result.balancedSuggestion.fromOther).toEqual(["BRA:1"]);
  });

  test("throws COMPARE_DISABLED when target disabled comparison", async () => {
    const t = convexTest(schema, modules);
    const { mine, other } = await twoAlbums(t);
    await t.mutation(api.albums.setCompareEnabled, {
      code: other.code,
      writeKey: other.writeKey,
      enabled: false,
    });
    await expectAppError(
      t.query(api.compare.compareWithAlbum, {
        myCode: mine.code,
        myWriteKey: mine.writeKey,
        otherCode: other.code,
      }),
      "COMPARE_DISABLED",
    );
  });

  test("throws ALBUM_NOT_FOUND for an unknown other code", async () => {
    const t = convexTest(schema, modules);
    const { mine } = await twoAlbums(t);
    await expectAppError(
      t.query(api.compare.compareWithAlbum, {
        myCode: mine.code,
        myWriteKey: mine.writeKey,
        otherCode: "ZZZZ-ZZZZ-ZZ",
      }),
      "ALBUM_NOT_FOUND",
    );
  });
});

describe("compare.getPublicCompareSnapshot", () => {
  test("returns the public diff when comparison is enabled", async () => {
    const t = convexTest(schema, modules);
    const { other } = await twoAlbums(t);
    const snap = await t.query(api.albums.getPublicCompareSnapshot, {
      code: other.code,
    });
    expect(snap).not.toBeNull();
    expect(snap!.code).toBe(other.code);
    expect(snap!.duplicateKeys).toEqual(["BRA:1"]);
    expect(snap!.duplicateQuantities).toEqual([{ key: "BRA:1", quantity: 1 }]);
    expect(snap!.missingKeys).not.toContain("BRA:1");
    // BRA:1 is the only owned sticker; everything else is missing.
    expect(snap!.missingKeys).toHaveLength(WC_2026_TEMPLATE.total - 1);
    expect(snap!.ownedCount).toBe(1);
    expect(snap!.duplicateCount).toBe(1);
  });

  test("returns null when comparison is disabled", async () => {
    const t = convexTest(schema, modules);
    const { other } = await twoAlbums(t);
    await t.mutation(api.albums.setCompareEnabled, {
      code: other.code,
      writeKey: other.writeKey,
      enabled: false,
    });
    const snap = await t.query(api.albums.getPublicCompareSnapshot, {
      code: other.code,
    });
    expect(snap).toBeNull();
  });

  test("throws ALBUM_NOT_FOUND for an unknown code", async () => {
    const t = convexTest(schema, modules);
    await expectAppError(
      t.query(api.albums.getPublicCompareSnapshot, {
        code: "ZZZZ-ZZZZ-ZZ",
      }),
      "ALBUM_NOT_FOUND",
    );
  });
});
