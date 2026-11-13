import type { ColorSwatch } from './types';

/**
 * Inspector-only colour parsing: turns "Cyan, magenta, black" into swatches.
 * Kept out of the render path; never called per frame.
 */
export const NAMED_COLORS: Record<string, string> = {
  black: '#111827',
  white: '#f8fafc',
  grey: '#6b7280',
  gray: '#6b7280',
  silver: '#cbd5e1',
  charcoal: '#334155',
  red: '#ef4444',
  crimson: '#be123c',
  burgundy: '#881337',
  maroon: '#7f1d1d',
  'soft red': '#f87171',
  pink: '#f472b6',
  'hot pink': '#ec4899',
  'pastel pink': '#fbcfe8',
  'baby pink': '#f9a8d4',
  'dusty rose': '#d8a4a8',
  magenta: '#d946ef',
  orange: '#f97316',
  'burnt orange': '#c2410c',
  'sunset orange': '#fb923c',
  rust: '#9a3412',
  terracotta: '#c26d53',
  ochre: '#ca8a04',
  yellow: '#eab308',
  'mustard yellow': '#ca8a04',
  'butter yellow': '#fef08a',
  'fluorescent yellow': '#eaff55',
  gold: '#f59e0b',
  'soft gold': '#fcd34d',
  cream: '#fef3c7',
  beige: '#e7e5e4',
  camel: '#c19a6b',
  sepia: '#785a3c',
  brown: '#78350f',
  'warm brown': '#92400e',
  'espresso brown': '#451a03',
  'mud brown': '#5c4033',
  walnut: '#5d4037',
  mahogany: '#6b211a',
  green: '#22c55e',
  'lime green': '#84cc16',
  'neon green': '#4ade80',
  'pastel green': '#bbf7d0',
  'sage green': '#84a98c',
  'forest green': '#166534',
  'moss green': '#4d7c0f',
  'leaf green': '#16a34a',
  emerald: '#10b981',
  'emerald green': '#059669',
  mint: '#6ee7b7',
  teal: '#14b8a6',
  turquoise: '#2dd4bf',
  aqua: '#22d3ee',
  cyan: '#06b6d4',
  'sky blue': '#38bdf8',
  'baby blue': '#93c5fd',
  blue: '#3b82f6',
  'electric blue': '#2563eb',
  'peacock blue': '#0369a1',
  navy: '#1e3a8a',
  'midnight blue': '#172554',
  purple: '#a855f7',
  'deep purple': '#581c87',
  violet: '#8b5cf6',
  lavender: '#c4b5fd',
  'faded denim': '#64748b',
  'warm white': '#fafaf9',
};

/** Never throws on null/undefined/malformed colour strings. */
export function parseColourSwatches(
  coloursStr: string | null | undefined
): ColorSwatch[] {
  if (!coloursStr || typeof coloursStr !== 'string') return [];
  const tokens = coloursStr
    .split(/[,;/•|\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const swatches: ColorSwatch[] = [];
  for (const token of tokens) {
    const clean = token.replace(/\(.*?\)/g, '').trim();
    const lower = clean.toLowerCase();
    if (!lower) continue;

    // Check explicit hex
    const hexMatch = lower.match(/#[0-9a-f]{3,6}/);
    if (hexMatch) {
      swatches.push({ label: clean, hex: hexMatch[0] });
      continue;
    }

    if (NAMED_COLORS[lower]) {
      swatches.push({ label: clean, hex: NAMED_COLORS[lower] });
      continue;
    }

    // Partial keyword fallback
    const matchedKey = Object.keys(NAMED_COLORS).find((k) => lower.includes(k));
    if (matchedKey) {
      swatches.push({ label: clean, hex: NAMED_COLORS[matchedKey] });
    }
  }
  return swatches.slice(0, 10);
}
