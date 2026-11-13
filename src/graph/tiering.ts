/**
 * Progressive-disclosure (LOD) rules.
 *
 * SINGLE SOURCE OF TRUTH: the Canvas renderer and the O(1) spatial-hash
 * hit-tester must both call `getNodeTierAlpha` with these thresholds so a node
 * can never be visible-but-unclickable (or vice versa).
 */

/** Below this zoom nodes render as lightweight dots instead of pill cards. */
export const DOT_MODE_MAX_ZOOM = 0.8;

/** At or above this zoom, loaded Fandom thumbnails are drawn inside cards. */
export const THUMBNAIL_MIN_ZOOM = 0.95;

/** Zoom at which Tier 3 labels start appearing above dots. */
export const TIER3_LABEL_MIN_ZOOM = 0.48;

/** Zoom at which Tier 4 labels start appearing above dots. */
export const TIER4_LABEL_MIN_ZOOM = 0.7;

/**
 * Computes progressive-disclosure opacity for a node based on its PageRank
 * tier (1-4) and the current camera zoom scale `k`. Nodes in an active hovered,
 * selected, or searched lineage always bypass culling (`isBypassed = true`).
 */
export function getNodeTierAlpha(tier: number, k: number, isBypassed: boolean): number {
  if (isBypassed || tier <= 2) return 1;
  if (tier === 3) {
    if (k < 0.4) return 0;
    if (k < 0.6) return (k - 0.4) / 0.2;
    return 1;
  }
  // Tier 4 (bottom 50% micro-aesthetics)
  if (k < 0.65) return 0;
  if (k < 0.85) return (k - 0.65) / 0.2;
  return 1;
}

/**
 * Whether a dot-mode node should queue an inverse-zoom screen-space title.
 * Tier 1-2 always label; Tier 3-4 fade in as the user zooms.
 */
export function shouldLabelDotNode(
  tier: number,
  k: number,
  isActive: boolean
): boolean {
  return (
    isActive ||
    tier <= 2 ||
    (tier === 3 && k >= TIER3_LABEL_MIN_ZOOM) ||
    (tier === 4 && k >= TIER4_LABEL_MIN_ZOOM)
  );
}
