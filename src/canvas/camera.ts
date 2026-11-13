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
