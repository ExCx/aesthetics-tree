/**
 * Chronological swimlane taxonomy.
 *
 * The "Undated" bucket is the fallback for `"year": null` wiki articles; it is
 * only rendered when the user enables the "Undated" visibility toggle.
 */

export interface EraBucket {
  id: string;
  label: string;
  minYear: number | null;
  maxYear: number | null;
  color: string;
}

export const ERA_BUCKETS: EraBucket[] = [
  { id: 'Pre-1900', label: 'Pre-1900', minYear: -Infinity, maxYear: 1899, color: '#d97706' },
  { id: '1900s', label: '1900s', minYear: 1900, maxYear: 1909, color: '#eab308' },
  { id: '1910s', label: '1910s', minYear: 1910, maxYear: 1919, color: '#84cc16' },
  { id: '1920s', label: '1920s', minYear: 1920, maxYear: 1929, color: '#10b981' },
  { id: '1930s', label: '1930s', minYear: 1930, maxYear: 1939, color: '#14b8a6' },
  { id: '1940s', label: '1940s', minYear: 1940, maxYear: 1949, color: '#06b6d4' },
  { id: '1950s', label: '1950s', minYear: 1950, maxYear: 1959, color: '#0ea5e9' },
  { id: '1960s', label: '1960s', minYear: 1960, maxYear: 1969, color: '#3b82f6' },
  { id: '1970s', label: '1970s', minYear: 1970, maxYear: 1979, color: '#6366f1' },
  { id: '1980s', label: '1980s', minYear: 1980, maxYear: 1989, color: '#8b5cf6' },
  { id: '1990s', label: '1990s', minYear: 1990, maxYear: 1999, color: '#a855f7' },
  { id: '2000s', label: '2000s', minYear: 2000, maxYear: 2009, color: '#d946ef' },
  { id: '2010s', label: '2010s', minYear: 2010, maxYear: 2019, color: '#ec4899' },
  { id: '2020s', label: '2020s', minYear: 2020, maxYear: 2029, color: '#f43f5e' },
  { id: 'Undated', label: 'Undated', minYear: null, maxYear: null, color: '#64748b' },
];

export const ERA_COLOR_MAP: Record<string, string> = Object.fromEntries(
  ERA_BUCKETS.map((b) => [b.id, b.color])
);

/**
 * Null-safe decade bucketing. `null`, `undefined`, `''`, `NaN` and other
 * non-finite values all land in "Undated" instead of poisoning layout math.
 */
export function getEraBucketId(year: number | string | null | undefined): string {
  if (year === null || year === undefined || year === '' || !Number.isFinite(Number(year))) {
    return 'Undated';
  }
  const y = Number(year);
  if (y < 1900) return 'Pre-1900';
  if (y >= 2020) return '2020s';
  const decade = Math.floor(y / 10) * 10;
  return `${decade}s`;
}
