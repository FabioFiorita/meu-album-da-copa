import { WC_2026_TEMPLATE } from "@convex/lib/templates";

type SectionTemplate = (typeof WC_2026_TEMPLATE.sections)[number];

/**
 * Count of distinct stickers in a section that the album owns (count >= 1).
 */
export function getOwnedCount(
  section: SectionTemplate,
  countByKey: Map<string, number>,
): number {
  return section.stickers.reduce(
    (sum, st) => sum + ((countByKey.get(st.key) ?? 0) >= 1 ? 1 : 0),
    0,
  );
}

/**
 * Total number of duplicate copies in a section (every copy beyond the first).
 */
export function getDuplicateCount(
  section: SectionTemplate,
  countByKey: Map<string, number>,
): number {
  return section.stickers.reduce(
    (sum, st) => sum + Math.max(0, (countByKey.get(st.key) ?? 0) - 1),
    0,
  );
}

/**
 * Integer completion percentage of `value` over `total`, clamped to 0..100.
 */
export function percentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}
