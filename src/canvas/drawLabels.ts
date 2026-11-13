import {
  FONT_FAMILY,
  HEADER_HEIGHT,
  LANE_COUNT_FONT,
  LANE_LABEL_FONT,
} from '../graph/constants';
import type { LabelCandidate, Swimlane } from '../graph/types';
import { drawRoundedRect } from './primitives';

export interface DotLabelArgs {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  k: number;
  camX: number;
  camY: number;
  hasSelection: boolean;
  candidates: LabelCandidate[];
}

/**
 * Inverse-zoom readable titles rendered in SCREEN space above each dot.
 *
 * Kept out of the world transform so typography stays crisp and font sizes are
 * zoom-independent. Truncation is char-based (using the pre-measured
 * `labelWidth`), so this pass never calls `measureText`.
 */
export function drawDotLabels({
  ctx,
  width,
  height,
  k,
  camX,
  camY,
  hasSelection,
  candidates,
}: DotLabelArgs): void {
  if (candidates.length === 0) return;

  candidates.sort((a, b) => {
    const scoreA =
      (a.isSelected || a.isHovered ? 10000 : 0) +
      (a.isInFamily || a.isSearchMatch ? 5000 : 0) +
      (5 - a.node.tier) * 500 +
      a.node.pagerank * 2000 +
      a.node.degree * 0.5;
    const scoreB =
      (b.isSelected || b.isHovered ? 10000 : 0) +
      (b.isInFamily || b.isSearchMatch ? 5000 : 0) +
      (5 - b.node.tier) * 500 +
      b.node.pagerank * 2000 +
      b.node.degree * 0.5;
    return scoreB - scoreA;
  });

  // Inverse-zoom screen font size: starts large (~14.5px) at far zoom (20%) and tapers to 11.5px by 80% zoom
  const screenFontPx = Math.round(Math.max(11.5, Math.min(15, 15.5 - k * 5)) * 2) / 2;
  ctx.font = `600 ${screenFontPx}px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const placedScreenBoxes: Array<{
    left: number;
    right: number;
    top: number;
    bottom: number;
  }> = [];

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];
    const screenX = item.node.x * k + camX;
    const screenY = item.node.y * k + camY;
    const dotScreenRadius = item.radius * k;

    // Position label cleanly ABOVE the node dot
    const labelBottomY = screenY - dotScreenRadius - 5;
    const pillH = screenFontPx + 6;

    // Deterministic char-based truncation keeps labels short without a per-frame measureText call
    let pillW = (item.node.labelWidth || 70) * (screenFontPx / 12) + 12;
    let labelText = item.node.label;
    const maxPillW = Math.min(228, Math.max(120, width * 0.24));
    if (pillW > maxPillW) {
      const allowedChars = Math.max(4, Math.floor(labelText.length * (maxPillW / pillW)));
      labelText = `${labelText.slice(0, Math.max(3, allowedChars - 1))}…`;
      pillW = maxPillW;
    }

    const boxLeft = screenX - pillW / 2;
    const boxRight = screenX + pillW / 2;
    const boxTop = labelBottomY - pillH;
    const boxBottom = labelBottomY;

    // Tight screen-bounds frustum check for labels
    if (boxRight < 0 || boxLeft > width || boxBottom < HEADER_HEIGHT || boxTop > height) {
      continue;
    }

    const collides =
      !item.isSelected &&
      !item.isHovered &&
      placedScreenBoxes.some(
        (b) =>
          boxLeft < b.right + 4 &&
          boxRight > b.left - 4 &&
          boxTop < b.bottom + 2 &&
          boxBottom > b.top - 2
      );
    if (collides) continue;
    placedScreenBoxes.push({
      left: boxLeft,
      right: boxRight,
      top: boxTop,
      bottom: boxBottom,
    });

    const isDimmedLabel =
      hasSelection &&
      !item.isInFamily &&
      !item.isSelected &&
      !item.isHovered &&
      !item.isSearchMatch;

    ctx.globalAlpha = isDimmedLabel ? 0.35 : 1;
    ctx.fillStyle =
      item.isSelected || item.isHovered
        ? 'rgba(30, 27, 75, 0.92)'
        : 'rgba(9, 13, 22, 0.86)';
    ctx.fillRect(boxLeft, boxTop, pillW, pillH);

    if (item.isSelected || item.isHovered || item.isInFamily || item.isSearchMatch) {
      ctx.strokeStyle = item.isSelected
        ? '#f472b6'
        : item.isHovered || item.isSearchMatch
        ? '#e879f9'
        : 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxLeft, boxTop, pillW, pillH);
    }

    ctx.fillStyle =
      item.isSelected || item.isHovered
        ? '#ffffff'
        : item.isInFamily || item.isSearchMatch
        ? '#f8fafc'
        : item.node.tier === 1
        ? '#f1f5f9'
        : '#cbd5e1';
    ctx.fillText(labelText, screenX, boxTop + pillH / 2 + 0.5);
  }
  ctx.globalAlpha = 1;
}

export interface DecadeBadgeArgs {
  ctx: CanvasRenderingContext2D;
  height: number;
  k: number;
  camY: number;
  swimlanes: Swimlane[];
}

/** Sticky left-edge decade badges, drawn in screen space. */
export function drawDecadeBadges({
  ctx,
  height,
  k,
  camY,
  swimlanes,
}: DecadeBadgeArgs): void {
  for (let i = 0; i < swimlanes.length; i++) {
    const lane = swimlanes[i];
    const screenTop = lane.top * k + camY;
    const screenBottom = lane.bottom * k + camY;
    if (screenBottom < HEADER_HEIGHT || screenTop > height) continue;

    const badgeY = Math.max(
      HEADER_HEIGHT + 10,
      Math.min(screenBottom - 26, screenTop + 10)
    );
    drawRoundedRect(ctx, 14, badgeY, 96, 22, 6);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(24, badgeY + 11, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = lane.color;
    ctx.fill();

    ctx.font = LANE_LABEL_FONT;
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(lane.label, 33, badgeY + 11.5);

    ctx.font = LANE_COUNT_FONT;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText(String(lane.count), 103, badgeY + 11.5);
  }
}
