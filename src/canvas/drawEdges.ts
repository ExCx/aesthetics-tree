import {
  COLOR_ANCESTOR,
  COLOR_DESCENDANT,
  COLOR_PEER,
  COLOR_SEARCH,
} from '../graph/constants';
import type {
  AlphaState,
  LayoutResult,
  LineageSets,
  PositionedNode,
} from '../graph/types';
import { setAlpha } from './primitives';

export interface EdgeDrawArgs {
  ctx: CanvasRenderingContext2D;
  alpha: AlphaState;
  k: number;
  worldLeft: number;
  worldRight: number;
  worldTop: number;
  worldBottom: number;
  layout: LayoutResult;
  hasSelection: boolean;
  lineage: LineageSets;
  hoveredNode: PositionedNode | null;
  hasSearchMatches: boolean;
  searchMatchSet: Set<string>;
  showSubgenres: boolean;
  showChronological: boolean;
  showOverlaps: boolean;
}

/**
 * Draws ONLY the active lineage / hover / search Path2D batches.
 * Ambient background edges are intentionally never drawn at any zoom level.
 */
export function drawActiveEdges({
  ctx,
  alpha,
  k,
  worldLeft,
  worldRight,
  worldTop,
  worldBottom,
  layout,
  hasSelection,
  lineage,
  hoveredNode,
  hasSearchMatches,
  searchMatchSet,
  showSubgenres,
  showChronological,
  showOverlaps,
}: EdgeDrawArgs): void {
  const ancestorBatch = hasSelection ? new Path2D() : null;
  const descendantBatch = hasSelection ? new Path2D() : null;
  const activePeerBatch = hasSelection ? new Path2D() : null;
  const hoverPreviewBatch = hoveredNode ? new Path2D() : null;
  const searchEdgeBatch = hasSearchMatches ? new Path2D() : null;

  // Only iterate edges when there is an active selection, hover, or search query
  if (hasSelection || hoveredNode || hasSearchMatches) {
    // Collect directed edges into active batches
    for (let i = 0; i < layout.layoutDirectedEdges.length; i++) {
      const edge = layout.layoutDirectedEdges[i];
      if (edge.kind === 'subgenre' && !showSubgenres) continue;
      if (edge.kind === 'chronological' && !showChronological) continue;

      // Frustum cull
      if (
        edge.maxX < worldLeft ||
        edge.minX > worldRight ||
        edge.maxY < worldTop ||
        edge.minY > worldBottom
      ) {
        continue;
      }

      if (hasSelection) {
        if (lineage.ancestorEdges.has(edge.id) && ancestorBatch) {
          ancestorBatch.addPath(edge.path);
          continue;
        }
        if (lineage.descendantEdges.has(edge.id) && descendantBatch) {
          descendantBatch.addPath(edge.path);
          continue;
        }
      }
      if (
        hoveredNode &&
        hoverPreviewBatch &&
        (edge.source === hoveredNode.id || edge.target === hoveredNode.id)
      ) {
        hoverPreviewBatch.addPath(edge.path);
        continue;
      }
      if (
        hasSearchMatches &&
        searchEdgeBatch &&
        (searchMatchSet.has(edge.source) || searchMatchSet.has(edge.target))
      ) {
        searchEdgeBatch.addPath(edge.path);
      }
    }

    // Collect peer/lateral edges into active batches
    for (let i = 0; i < layout.layoutPeerEdges.length; i++) {
      const edge = layout.layoutPeerEdges[i];
      if (
        edge.maxX < worldLeft ||
        edge.minX > worldRight ||
        edge.maxY < worldTop ||
        edge.minY > worldBottom
      ) {
        continue;
      }

      if (hasSelection && lineage.peerEdgesSet.has(edge.id) && activePeerBatch) {
        activePeerBatch.addPath(edge.path);
        continue;
      }
      if (
        hoveredNode &&
        hoverPreviewBatch &&
        (edge.source === hoveredNode.id || edge.target === hoveredNode.id)
      ) {
        hoverPreviewBatch.addPath(edge.path);
        continue;
      }
      if (
        showOverlaps &&
        hasSearchMatches &&
        searchEdgeBatch &&
        (searchMatchSet.has(edge.source) || searchMatchSet.has(edge.target))
      ) {
        searchEdgeBatch.addPath(edge.path);
      }
    }
  }

  const activeStrokeW = Math.max(2.1, 2.7 / Math.sqrt(k));

  if (searchEdgeBatch) {
    setAlpha(ctx, alpha, 0.65);
    ctx.strokeStyle = COLOR_SEARCH;
    ctx.lineWidth = Math.max(1.5, 2.0 / Math.sqrt(k));
    ctx.stroke(searchEdgeBatch);
  }

  if (hoverPreviewBatch) {
    setAlpha(ctx, alpha, 0.88);
    ctx.strokeStyle = COLOR_SEARCH;
    ctx.lineWidth = activeStrokeW;
    ctx.stroke(hoverPreviewBatch);
  }

  if (activePeerBatch) {
    setAlpha(ctx, alpha, 0.92);
    ctx.strokeStyle = COLOR_PEER;
    ctx.lineWidth = activeStrokeW;
    ctx.setLineDash([6, 5]);
    ctx.stroke(activePeerBatch);
    ctx.setLineDash([]);
  }

  if (ancestorBatch) {
    setAlpha(ctx, alpha, 0.95);
    ctx.strokeStyle = COLOR_ANCESTOR;
    ctx.lineWidth = activeStrokeW;
    ctx.stroke(ancestorBatch);
  }

  if (descendantBatch) {
    setAlpha(ctx, alpha, 0.95);
    ctx.strokeStyle = COLOR_DESCENDANT;
    ctx.lineWidth = activeStrokeW;
    ctx.stroke(descendantBatch);
  }
}
