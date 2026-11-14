import {
  DRAWER_BREAKPOINT,
  DRAWER_WIDTH,
  FIT_MAX_SCALE,
  FIT_MIN_SCALE,
  FOCUS_MAX_SCALE,
  FOCUS_MIN_SCALE,
  HEADER_HEIGHT,
  INITIAL_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  PAN_MIN_VISIBLE_FRACTION,
} from '../graph/constants';
import type { CameraState, LayoutBounds } from '../graph/types';

/**
 * Pure camera math shared by wheel zoom, button zoom, pinch zoom, fit-view and
 * focus-node. No React, no DOM reads: pass the viewport size in.
 */
export interface ViewportSize {
  width: number;
  height: number;
}

export interface CameraTarget {
  x: number;
  y: number;
  scale: number;
}

/** Allowed camera translation (screen px) that keeps the graph on screen. */
export interface PanLimits {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function createCameraState(scale: number = INITIAL_SCALE): CameraState {
  return { x: 0, y: 0, scale, targetX: 0, targetY: 0, targetScale: scale };
}

export function clampScale(scale: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
}

/** Viewport area available after the fixed header and desktop drawer. */
export function availableViewport(
  viewport: ViewportSize,
  hasSelection: boolean
): { availW: number; availH: number } {
  const drawerOffset =
    hasSelection && viewport.width > DRAWER_BREAKPOINT ? DRAWER_WIDTH : 0;
  return {
    availW: Math.max(200, viewport.width - drawerOffset),
    availH: Math.max(200, viewport.height - HEADER_HEIGHT),
  };
}

/** Scale + translation that frames the whole graph (animated fit-view). */
export function computeFitView(
  bounds: LayoutBounds,
  viewport: ViewportSize,
  hasSelection: boolean
): CameraTarget {
  const { availW, availH } = availableViewport(viewport, hasSelection);

  const graphW = Math.max(400, bounds.maxX - bounds.minX);
  const graphH = Math.max(400, bounds.maxY - bounds.minY);

  const scaleX = availW / graphW;
  const scaleY = availH / graphH;
  const scale = Math.max(
    FIT_MIN_SCALE,
    Math.min(FIT_MAX_SCALE, Math.min(scaleX, scaleY) * 0.92)
  );

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return {
    x: availW / 2 - centerX * scale,
    y: HEADER_HEIGHT + availH / 2 - centerY * scale,
    scale,
  };
}

/**
 * Scale + translation that centers one node without zooming out.
 * Always reserves the inspector drawer width on desktop, because focusing a
 * node also selects it.
 */
export function computeFocusView(
  node: { x: number; y: number },
  viewport: ViewportSize,
  currentTargetScale: number
): CameraTarget {
  const { availW, availH } = availableViewport(viewport, true);
  const scale = Math.max(
    FOCUS_MIN_SCALE,
    Math.min(FOCUS_MAX_SCALE, currentTargetScale)
  );

  return {
    x: availW / 2 - node.x * scale,
    y: HEADER_HEIGHT + availH / 2 - node.y * scale,
    scale,
  };
}

/** Zoom around a screen-space anchor point (mutates the camera target). */
export function zoomCameraAt(
  camera: CameraState,
  screenX: number,
  screenY: number,
  factor: number
): void {
  const newScale = clampScale(camera.targetScale * factor);

  const worldX = (screenX - camera.targetX) / camera.targetScale;
  const worldY = (screenY - camera.targetY) / camera.targetScale;

  camera.targetScale = newScale;
  camera.targetX = screenX - worldX * newScale;
  camera.targetY = screenY - worldY * newScale;
}

/** Applies a computed target, keeping the eased current values untouched. */
export function setCameraTarget(camera: CameraState, target: CameraTarget): void {
  camera.targetX = target.x;
  camera.targetY = target.y;
  camera.targetScale = target.scale;
}

/** Snaps the camera (used on initial fit, where no easing should occur). */
export function snapCamera(camera: CameraState, target: CameraTarget): void {
  camera.x = target.x;
  camera.y = target.y;
  camera.scale = target.scale;
  camera.targetX = target.x;
  camera.targetY = target.y;
  camera.targetScale = target.scale;
}

/**
 * Allowed camera translation along one axis.
 *
 * The visible world span `viewportScreen / scale` must overlap the content
 * range by at least `PAN_MIN_VISIBLE_FRACTION` of itself (capped at the content
 * extent, so a fully-fitted graph simply cannot be panned off screen).
 *
 * @param contentMin/contentMax content range in world units
 * @param offsetScreen  screen coordinate where the available area starts
 * @param viewportScreen size of the available area in screen px
 */
function axisCameraRange(
  contentMin: number,
  contentMax: number,
  offsetScreen: number,
  viewportScreen: number,
  scale: number
): { min: number; max: number } {
  const contentExtent = Math.max(1, contentMax - contentMin);
  const viewWorld = viewportScreen / scale;
  const minOverlap = Math.min(contentExtent, viewWorld * PAN_MIN_VISIBLE_FRACTION);

  const min = offsetScreen - (contentMax - minOverlap) * scale;
  const max = offsetScreen + viewportScreen - (contentMin + minOverlap) * scale;
  return min <= max ? { min, max } : { min: max, max: min };
}

/**
 * Camera translation limits that stop the user from panning into an empty void.
 * Uses the same available viewport as `computeFitView`, so a fitted graph
 * remains exactly centred instead of being nudged by the clamp.
 */
export function computePanLimits(
  bounds: LayoutBounds,
  viewport: ViewportSize,
  scale: number,
  hasSelection: boolean
): PanLimits {
  const k = Number.isFinite(scale) && scale > 0 ? scale : INITIAL_SCALE;
  const { availW, availH } = availableViewport(viewport, hasSelection);
  const x = axisCameraRange(bounds.minX, bounds.maxX, 0, availW, k);
  const y = axisCameraRange(bounds.minY, bounds.maxY, HEADER_HEIGHT, availH, k);
  return { minX: x.min, maxX: x.max, minY: y.min, maxY: y.max };
}

function clampValue(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamps both the eased camera and its animation target into `bounds`.
 * Called after every user-driven pan/zoom so no gesture can escape the graph.
 */
export function clampCameraToBounds(
  camera: CameraState,
  bounds: LayoutBounds,
  viewport: ViewportSize,
  hasSelection: boolean
): void {
  const current = computePanLimits(bounds, viewport, camera.scale, hasSelection);
  // `clampValue` maps non-finite input to the lower limit, so a poisoned camera
  // can never keep a NaN transform.
  camera.x = clampValue(camera.x, current.minX, current.maxX);
  camera.y = clampValue(camera.y, current.minY, current.maxY);

  const target = computePanLimits(bounds, viewport, camera.targetScale, hasSelection);
  camera.targetX = clampValue(camera.targetX, target.minX, target.maxX);
  camera.targetY = clampValue(camera.targetY, target.minY, target.maxY);
}
