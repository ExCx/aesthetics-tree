import type { AlphaState } from '../graph/types';

/** Shared canvas primitives. No state, no allocation in the hot path. */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Skips redundant `globalAlpha` writes while keeping the tracked value in
 * sync with the real context state (shared across edge + node passes).
 */
export function setAlpha(
  ctx: CanvasRenderingContext2D,
  alpha: AlphaState,
  a: number
): void {
  if (Math.abs(alpha.current - a) > 0.005) {
    ctx.globalAlpha = a;
    alpha.current = a;
  }
}
