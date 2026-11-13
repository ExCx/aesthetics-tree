/**
 * Tuning constants shared by the layout engine, the renderer and the
 * O(1) hit-tester.
 *
 * Anything in here is a *frame-independent* value. Per-frame values belong in
 * the render functions, not in this module.
 */

// ---------------------------------------------------------------------------
// Layout geometry (precomputed, never measured per frame)
// ---------------------------------------------------------------------------
export const NODE_W = 156;
export const NODE_H = 36;
export const H_GAP = 26;
export const SUBROW_H = 54;
export const ERA_PADDING_Y = 36;
export const MAX_COLS_PER_SUBROW = 34;

/** 256×256 spatial hash cell size. Must match layout insertion + hit-testing. */
export const SPATIAL_CELL_SIZE = 256;

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
export const MIN_SCALE = 0.14;
export const MAX_SCALE = 3.5;
export const INITIAL_SCALE = 0.85;
export const WHEEL_ZOOM_STEP = 1.16;
export const BUTTON_ZOOM_STEP = 1.28;
export const CAMERA_EASING = 0.24;
export const FIT_MAX_SCALE = 1.05;
export const FIT_MIN_SCALE = 0.14;
export const FOCUS_MIN_SCALE = 0.95;
export const FOCUS_MAX_SCALE = 1.35;

/** Header height reserved at the top of the viewport when fitting/focusing. */
export const HEADER_HEIGHT = 56;
/** Width of the right-hand inspector drawer on desktop. */
export const DRAWER_WIDTH = 380;
/** Viewport width above which the drawer offset is applied. */
export const DRAWER_BREAKPOINT = 768;

// ---------------------------------------------------------------------------
// Typography (fonts are assigned far more often than labels are measured)
// ---------------------------------------------------------------------------
export const FONT_FAMILY = 'Inter, system-ui, sans-serif';
export const BADGE_FONT = `600 10px ${FONT_FAMILY}`;
export const CARD_LABEL_FONT_BOLD = `700 12px ${FONT_FAMILY}`;
export const CARD_LABEL_FONT_MEDIUM = `500 12px ${FONT_FAMILY}`;
export const LANE_LABEL_FONT = `700 11px ${FONT_FAMILY}`;
export const LANE_COUNT_FONT = `500 10px ${FONT_FAMILY}`;

// ---------------------------------------------------------------------------
// Canvas palette
// ---------------------------------------------------------------------------
export const CANVAS_BG = '#090d16';
export const LANE_BG_EVEN = '#0d1322';
export const LANE_BG_ODD = '#090d16';
export const LANE_DIVIDER = 'rgba(51, 65, 85, 0.35)';

export const COLOR_SELECTED = '#f472b6';
export const COLOR_ANCESTOR = '#f59e0b';
export const COLOR_DESCENDANT = '#06b6d4';
export const COLOR_PEER = '#a855f7';
export const COLOR_SEARCH = '#e879f9';
