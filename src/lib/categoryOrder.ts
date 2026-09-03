// src/lib/categoryOrder.ts
// Storefront display order for categories under Men/Women: New Arrival first,
// then Tops, Bottom, Outerwear, Set, Essential, with Tailoring last. Matched by
// keyword (case-insensitive, tolerant of "Bottoms" vs "Bottom" etc.) rather than
// exact category names, since those are admin-entered free text.

const ORDER_KEYWORDS: RegExp[] = [
  /new\s*arrivals?/i,
  /^tops?\b/i,
  /bottoms?/i,
  /outer\s*wear/i,
  /^sets?\b/i,
  /essentials?/i,
  /tailor/i,
];

/** Categories named exactly "New" are redundant now that "New Arrival" exists
 * and should be hidden from storefront category lists. */
export function isRedundantNewCategory(name: string): boolean {
  return /^new$/i.test(name.trim());
}

function categoryRank(name: string): number {
  const idx = ORDER_KEYWORDS.findIndex(re => re.test(name.trim()));
  return idx === -1 ? ORDER_KEYWORDS.length : idx;
}

/** Sort categories into the storefront order, alphabetically among any that
 * don't match a known keyword (so unmapped categories don't vanish, they
 * just land at the end). */
export function sortCategoriesForStorefront<T extends { name: string }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const rankDiff = categoryRank(a.name) - categoryRank(b.name);
    return rankDiff !== 0 ? rankDiff : a.name.localeCompare(b.name);
  });
}

/** Drops the redundant "New" category and applies the storefront sort order —
 * the combination used everywhere Men/Women categories are listed. */
export function prepareStorefrontCategories<T extends { name: string }>(categories: T[]): T[] {
  return sortCategoriesForStorefront(categories.filter(c => !isRedundantNewCategory(c.name)));
}
