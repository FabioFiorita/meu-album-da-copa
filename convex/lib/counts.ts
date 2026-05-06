export const COUNT_MAX = 99;

export function sanitizeCount(count: number): number {
  if (!Number.isFinite(count)) return 0;
  const n = Math.trunc(count);
  if (n < 0) return 0;
  if (n > COUNT_MAX) return COUNT_MAX;
  return n;
}

export function ownedDelta(oldCount: number, newCount: number): number {
  const o = oldCount >= 1 ? 1 : 0;
  const n = newCount >= 1 ? 1 : 0;
  return n - o;
}

export function duplicateDelta(oldCount: number, newCount: number): number {
  return Math.max(0, newCount - 1) - Math.max(0, oldCount - 1);
}
