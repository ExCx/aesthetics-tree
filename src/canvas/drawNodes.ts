import {
  BADGE_FONT,
  CARD_LABEL_FONT_BOLD,
  CARD_LABEL_FONT_MEDIUM,
  COLOR_ANCESTOR,
  COLOR_DESCENDANT,
  COLOR_PEER,
  COLOR_SEARCH,
  COLOR_SELECTED,
} from '../graph/constants';
import { getNodeTierAlpha, shouldLabelDotNode } from '../graph/tiering';
import type {
  AlphaState,
  LabelCandidate,
  LayoutResult,
  LineageSets,
  PositionedNode,
  ThumbnailLoader,
} from '../graph/types';
import { drawRoundedRect, setAlpha } from './primitives';

export interface NodeDrawArgs {
  ctx: CanvasRenderingContext2D;
  alpha: AlphaState;
  k: number;
  worldLeft: number;
  worldRight: number;
  worldTop: number;
  worldBottom: number;
  layout: LayoutResult;
  selectedId: string | null;
  hoveredId: string | null;
  hoveredNode: PositionedNode | null;
  lineage: LineageSets;
  hasSelection: boolean;
  hasSearchMatches: boolean;
  searchMatchSet: Set<string>;
  isDotMode: boolean;
  isHighZoom: boolean;
  loadThumbnail: ThumbnailLoader;
}

/**
 * Renders every visible node in dot mode (k < 0.80) or full pill-card mode.
 * Returns the dot labels that must be drawn in screen space afterwards.
 */
export function drawNodes({
  ctx,
  alpha,
  k,
  worldLeft,
  worldRight,
  worldTop,
  worldBottom,
  layout,
  selectedId,
  hoveredId,
  hoveredNode,
  lineage,
  hasSelection,
  hasSearchMatches,
  searchMatchSet,
  isDotMode,
  isHighZoom,
  loadThumbnail,
}: NodeDrawArgs): LabelCandidate[] {
  const deferredLabels: LabelCandidate[] = [];

  for (let i = 0; i < layout.positionedNodes.length; i++) {
    const node = layout.positionedNodes[i];

    // Tight viewport frustum culling (uses actual dot radius in dot mode, pill half-dimensions in card mode)
    const extentX = isDotMode ? node.dotRadius + 8 : node.width / 2 + 6;
    const extentY = isDotMode ? node.dotRadius + 8 : node.height / 2 + 6;
    if (
      node.x + extentX < worldLeft ||
      node.x - extentX > worldRight ||
      node.y + extentY < worldTop ||
      node.y - extentY > worldBottom
    ) {
      continue;
    }

    const isSelected = node.id === selectedId;
    const isHovered = node.id === hoveredId;
    const isAncestor = hasSelection && lineage.ancestorNodes.has(node.id);
    const isDescendant = hasSelection && lineage.descendantNodes.has(node.id);
    const isPeer = hasSelection && lineage.peerNodes.has(node.id);
    const isHoveredNeighbor = Boolean(
      hoveredNode &&
        (hoveredNode.parents.includes(node.id) ||
          hoveredNode.children.includes(node.id) ||
          hoveredNode.peers.includes(node.id))
    );
    const isSearchMatch = hasSearchMatches && searchMatchSet.has(node.id);
    const isInFamily = isSelected || isAncestor || isDescendant || isPeer;
    const isBypassed = isInFamily || isHovered || isHoveredNeighbor || isSearchMatch;

    // Progressive disclosure culling & fade based on node.tier and zoom k
    const tierAlpha = getNodeTierAlpha(node.tier, k, isBypassed);
    if (tierAlpha <= 0.01) continue;

    const isDimmed = hasSelection && !isInFamily && !isHovered && !isSearchMatch;

    let accentColor = node.eraColor;
    if (isSelected) accentColor = COLOR_SELECTED;
    else if (isAncestor) accentColor = COLOR_ANCESTOR;
    else if (isDescendant) accentColor = COLOR_DESCENDANT;
    else if (isPeer) accentColor = COLOR_PEER;
    else if (isSearchMatch) accentColor = COLOR_SEARCH;

    const finalAlpha = (isDimmed ? 0.16 : 1) * tierAlpha;

    if (isDotMode) {
      const baseRadius = node.dotRadius;
      const radius = isSelected
        ? baseRadius + 4
        : isInFamily || isHovered || isSearchMatch
        ? baseRadius + 2
        : baseRadius;

      // Lightweight concentric halo for active or Tier 1 nodes
      if (isSelected || isHovered || isInFamily || isSearchMatch || node.tier === 1) {
        setAlpha(ctx, alpha, (isDimmed ? 0.04 : isSelected ? 0.34 : 0.18) * tierAlpha);
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.fill();
      }

      setAlpha(ctx, alpha, finalAlpha);
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#ffffff' : accentColor;
      ctx.fill();

      if (isSelected || isHovered || isInFamily || isSearchMatch) {
        ctx.lineWidth = 2.2 / k;
        ctx.strokeStyle = isSelected ? COLOR_SELECTED : '#ffffff';
        ctx.stroke();
      }

      // Queue readable title above dot (Tier 1-2 always, Tier 3-4 as zoom increases, plus all active/lineage nodes)
      if (
        shouldLabelDotNode(
          node.tier,
          k,
          isSelected || isHovered || isInFamily || isSearchMatch
        )
      ) {
        deferredLabels.push({
          node,
          radius,
          isSelected,
          isHovered,
          isInFamily,
          isSearchMatch,
        });
      }
    } else {
      const w = node.width;
      const h = node.height;
      const left = node.x - w / 2;
      const top = node.y - h / 2;
      const r = h / 2;

      // Lightweight concentric outer halo for active/hovered pill
      if (isSelected || isHovered || isSearchMatch) {
        setAlpha(ctx, alpha, (isSelected ? 0.24 : 0.16) * tierAlpha);
        drawRoundedRect(ctx, left - 4, top - 4, w + 8, h + 8, r + 4);
        ctx.fillStyle = accentColor;
        ctx.fill();
      }

      setAlpha(ctx, alpha, finalAlpha);
      drawRoundedRect(ctx, left, top, w, h, r);
      ctx.fillStyle = isSelected ? '#1e1b4b' : isInFamily ? '#111b2e' : '#0f172a';
      ctx.fill();

      ctx.lineWidth = isSelected ? 2.4 : isInFamily || isHovered || isSearchMatch ? 1.9 : 1.1;
      ctx.strokeStyle =
        isSelected || isInFamily || isHovered || isSearchMatch ? accentColor : '#263349';
      ctx.stroke();

      // Lazy-load and render Fandom CDN thumbnail inside node card at high zoom (k >= 0.95)
      let drewThumbnail = false;
      if (isHighZoom && node.image) {
        const loadedImg = loadThumbnail(node.image);
        if (loadedImg && loadedImg.complete && loadedImg.naturalWidth > 0) {
          const thumbR = 11.5;
          const thumbCx = left + 18;
          const thumbCy = node.y;

          ctx.save();
          ctx.beginPath();
          ctx.arc(thumbCx, thumbCy, thumbR, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          // Center-crop square slice from source image
          const sw = loadedImg.naturalWidth;
          const sh = loadedImg.naturalHeight;
          const sMin = Math.min(sw, sh);
          const sx = (sw - sMin) / 2;
          const sy = (sh - sMin) / 2;
          ctx.drawImage(
            loadedImg,
            sx,
            sy,
            sMin,
            sMin,
            thumbCx - thumbR,
            thumbCy - thumbR,
            thumbR * 2,
            thumbR * 2
          );
          ctx.restore();

          // Crisp accent border ring around thumbnail
          ctx.beginPath();
          ctx.arc(thumbCx, thumbCy, thumbR, 0, Math.PI * 2);
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = accentColor;
          ctx.stroke();
          drewThumbnail = true;
        }
      }

      if (!drewThumbnail) {
        // Standard left era dot fallback
        ctx.beginPath();
        ctx.arc(left + 14, node.y, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.fill();
      }

      // Pre-measured degree badge on right
      const badgeW = node.badgeW;
      const badgeH = 18;
      const badgeX = left + w - badgeW - 8;
      const badgeY = node.y - badgeH / 2;

      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 9);
      ctx.fillStyle = isInFamily ? 'rgba(255,255,255,0.1)' : 'rgba(30, 41, 59, 0.85)';
      ctx.fill();

      ctx.font = BADGE_FONT;
      ctx.fillStyle = isInFamily ? '#f8fafc' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.degText, badgeX + badgeW / 2, node.y + 0.5);

      // Pre-truncated title label (shifted right when thumbnail is rendered)
      ctx.font =
        isSelected || isInFamily ? CARD_LABEL_FONT_BOLD : CARD_LABEL_FONT_MEDIUM;
      ctx.fillStyle = isSelected ? '#ffffff' : isInFamily ? '#f8fafc' : '#e2e8f0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        drewThumbnail ? node.truncatedLabelThumb : node.truncatedLabel,
        drewThumbnail ? left + 35 : left + 24,
        node.y + 0.5
      );
    }
  }

  return deferredLabels;
}
