import { describe, expect, test } from "vitest";
import { COUNT_MAX, duplicateDelta, ownedDelta, sanitizeCount } from "./counts";

// Pure unit tests for the count helpers. These same helpers are reused by the
// client-side optimistic updates in src/hooks/useStickerActions.ts, so this is
// the contract that keeps server + optimistic UI in parity.

describe("sanitizeCount", () => {
  test("truncates fractional values toward zero", () => {
    expect(sanitizeCount(3.7)).toBe(3);
    expect(sanitizeCount(0.9)).toBe(0);
  });

  test("clamps negatives to 0", () => {
    expect(sanitizeCount(-1)).toBe(0);
    expect(sanitizeCount(-999)).toBe(0);
  });

  test("clamps above COUNT_MAX to COUNT_MAX", () => {
    expect(sanitizeCount(COUNT_MAX + 1)).toBe(COUNT_MAX);
    expect(sanitizeCount(1000)).toBe(COUNT_MAX);
  });

  test("non-finite values become 0", () => {
    expect(sanitizeCount(Number.NaN)).toBe(0);
    expect(sanitizeCount(Number.POSITIVE_INFINITY)).toBe(0);
    expect(sanitizeCount(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  test("keeps in-range boundaries intact", () => {
    expect(sanitizeCount(0)).toBe(0);
    expect(sanitizeCount(1)).toBe(1);
    expect(sanitizeCount(COUNT_MAX)).toBe(COUNT_MAX);
  });
});

describe("ownedDelta", () => {
  test("0 -> 1 gains one owned", () => {
    expect(ownedDelta(0, 1)).toBe(1);
  });

  test("1 -> 2 stays owned (no change)", () => {
    expect(ownedDelta(1, 2)).toBe(0);
  });

  test("2 -> 0 loses one owned", () => {
    expect(ownedDelta(2, 0)).toBe(-1);
    expect(ownedDelta(1, 0)).toBe(-1);
  });

  test("0 -> 0 is no change", () => {
    expect(ownedDelta(0, 0)).toBe(0);
  });
});

describe("duplicateDelta", () => {
  test("0 -> 1 adds no duplicates", () => {
    expect(duplicateDelta(0, 1)).toBe(0);
  });

  test("1 -> 2 adds one duplicate", () => {
    expect(duplicateDelta(1, 2)).toBe(1);
  });

  test("0 -> 2 adds one duplicate", () => {
    expect(duplicateDelta(0, 2)).toBe(1);
  });

  test("2 -> 0 removes one duplicate", () => {
    expect(duplicateDelta(2, 0)).toBe(-1);
  });

  test("3 -> 1 removes two duplicates", () => {
    expect(duplicateDelta(3, 1)).toBe(-2);
  });

  test("1 -> 1 is no change", () => {
    expect(duplicateDelta(1, 1)).toBe(0);
  });
});
