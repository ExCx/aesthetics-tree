import { ERA_BUCKETS } from './eras';
import {
  ERA_PADDING_Y,
  H_GAP,
  MAX_COLS_PER_SUBROW,
  NODE_H,
  NODE_W,
  SPATIAL_CELL_SIZE,
  SUBROW_H,
} from './constants';
import type {
  BezierGeometry,
  GraphEdge,
  LayoutEdge,
  LayoutResult,
  NormalizedNode,
  PositionedNode,
  Swimlane,
} from './types';

/**
 * Offscreen 2D context dedicated to text measurement. Shared across layout
 * passes; `measureText` must never be called inside the RAF draw loop.
 */
let sharedMeasureCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (!sharedMeasureCtx && typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    sharedMeasureCtx = c.getContext('2d');
  }
  return sharedMeasureCtx;
}

/**
 * Builds a native Path2D Bézier for an edge and its conservative bounding box
 * used for per-frame frustum culling.
 */
export function buildCubicBezierPath(
  src: { x: number; y: number },
  tgt: { x: number; y: number }
): BezierGeometry {
  const path = new Path2D();
  const sx = Number.isFinite(src.x) ? src.x : 0;
  const sy = Number.isFinite(src.y) ? src.y : 0;
  const tx = Number.isFinite(tgt.x) ? tgt.x : 0;
  const ty = Number.isFinite(tgt.y) ? tgt.y : 0;
  const dy = ty - sy;
  const dx = tx - sx;

  if (Math.abs(dy) < 25) {
    const arcHeight = Math.min(75, Math.max(24, Math.abs(dx) * 0.18));
    path.moveTo(sx, sy);
    path.bezierCurveTo(
      sx + dx * 0.25,
      sy - arcHeight,
      tx - dx * 0.25,
      ty - arcHeight,
      tx,
      ty
    );
    return {
      path,
      minX: Math.min(sx, tx) - 20,
      maxX: Math.max(sx, tx) + 20,
      minY: Math.min(sy, ty) - arcHeight - 10,
      maxY: Math.max(sy, ty) + 20,
    };
  }

  const cpOffset = Math.abs(dy) * 0.48;
  path.moveTo(sx, sy);
  path.bezierCurveTo(
    sx,
    sy + (dy > 0 ? cpOffset : -cpOffset),
    tx,
    ty - (dy > 0 ? cpOffset : -cpOffset),
    tx,
    ty
  );
  return {
    path,
    minX: Math.min(sx, tx) - 20,
    maxX: Math.max(sx, tx) + 20,
    minY: Math.min(sy, ty) - 20,
    maxY: Math.max(sy, ty) + 20,
  };
}

/**
 * Computes Time-Anchored Barycenter Coordinates, pre-measures text truncation,
 * precomputes native Path2D curves for all visible edges, and builds an O(1)
 * 256x256 spatial hash grid for instantaneous pointer hit-testing.
 *
 * All geometry is derived from already-normalized nodes; nothing here runs per
 * animation frame.
 */
export function computeChronologicalLayout(
  visibleNodes: NormalizedNode[],
  directedEdges: GraphEdge[],
  peerEdges: GraphEdge[],
  showUndated: boolean
): LayoutResult {
  const activeSet = new Set(visibleNodes.map((n) => n.id));
  const buckets = new Map<string, NormalizedNode[]>();
  for (const era of ERA_BUCKETS) {
    if (era.id === 'Undated' && !showUndated) continue;
    buckets.set(era.id, []);
  }

  for (const node of visibleNodes) {
    if (node.eraId === 'Undated' && !showUndated) continue;
    const list = buckets.get(node.eraId);
    if (list) list.push(node);
  }

  // Initial deterministic sort within each era: high-PageRank & high-degree hubs near center
  for (const [, list] of buckets) {
    list.sort((a, b) => {
      const yA = a.year !== null && Number.isFinite(a.year) ? a.year : 9999;
      const yB = b.year !== null && Number.isFinite(b.year) ? b.year : 9999;
      if (yA !== yB) return yA - yB;
      return (
        a.tier - b.tier ||
        b.pagerank - a.pagerank ||
        b.degree - a.degree ||
        a.label.localeCompare(b.label)
      );
    });
    const centered: NormalizedNode[] = [];
    list.forEach((item, idx) => {
      if (idx % 2 === 0) centered.push(item);
      else centered.unshift(item);
    });
    list.splice(0, list.length, ...centered);
  }

  // Build adjacency for active nodes only
  const neighborsMap = new Map<string, string[]>();
  for (const n of visibleNodes) neighborsMap.set(n.id, []);
  for (const e of directedEdges) {
    if (activeSet.has(e.source) && activeSet.has(e.target)) {
      neighborsMap.get(e.source)?.push(e.target);
      neighborsMap.get(e.target)?.push(e.source);
    }
  }
  for (const e of peerEdges) {
    if (activeSet.has(e.source) && activeSet.has(e.target)) {
      neighborsMap.get(e.source)?.push(e.target);
      neighborsMap.get(e.target)?.push(e.source);
    }
  }

  // Assign normalized initial X rank in [-1, 1]
  const normX = new Map<string, number>();
  for (const [, list] of buckets) {
    const len = list.length;
    list.forEach((node, idx) => {
      normX.set(node.id, len <= 1 ? 0 : (idx / (len - 1)) * 2 - 1);
    });
  }

  // 3 iterations of Barycenter horizontal sorting
  const eraKeys = Array.from(buckets.keys());
  for (let iter = 0; iter < 3; iter++) {
    const order = iter % 2 === 0 ? eraKeys : [...eraKeys].reverse();
    for (const eraId of order) {
      const list = buckets.get(eraId);
      if (!list || list.length <= 1) continue;

      const barycenters = new Map<string, number>();
      for (const node of list) {
        const nbrs = neighborsMap.get(node.id) || [];
        if (nbrs.length === 0) {
          barycenters.set(node.id, normX.get(node.id) ?? 0);
        } else {
          let sum = 0;
          for (const nbrId of nbrs) {
            sum += normX.get(nbrId) ?? 0;
          }
          const avg = sum / nbrs.length;
          const cur = normX.get(node.id) ?? 0;
          const val = 0.8 * avg + 0.2 * cur;
          barycenters.set(node.id, Number.isFinite(val) ? val : 0);
        }
      }

      list.sort((a, b) => (barycenters.get(a.id) ?? 0) - (barycenters.get(b.id) ?? 0));
      const len = list.length;
      list.forEach((node, idx) => {
        normX.set(node.id, len <= 1 ? 0 : (idx / (len - 1)) * 2 - 1);
      });
    }
  }

  const mCtx = getMeasureContext();
  const positionedNodes: PositionedNode[] = [];
  const positionedMap = new Map<string, PositionedNode>();
  const spatialGrid = new Map<string, PositionedNode[]>();
  const swimlanes: Swimlane[] = [];

  let currentY = 80;
  let minX = -600;
  let maxX = 600;

  for (const era of ERA_BUCKETS) {
    if (!buckets.has(era.id)) continue;
    const list = buckets.get(era.id) || [];
    const count = list.length;

    const numSubRows = Math.max(1, Math.ceil(count / MAX_COLS_PER_SUBROW));
    const bandHeight = Math.max(116, numSubRows * SUBROW_H + ERA_PADDING_Y * 2);
    const bandTop = currentY;
    const bandBottom = currentY + bandHeight;

    swimlanes.push({
      id: era.id,
      label: era.label,
      color: era.color,
      count,
      top: bandTop,
      bottom: bandBottom,
      height: bandHeight,
    });

    if (count > 0) {
      for (let idx = 0; idx < count; idx++) {
        const node = list[idx];
        const subRow = idx % numSubRows;
        const col = Math.floor(idx / numSubRows);
        const colsInThisSubRow = Math.ceil((count - subRow) / numSubRows);

        const rowWidth = (colsInThisSubRow - 1) * (NODE_W + H_GAP);
        const rawX = -rowWidth / 2 + col * (NODE_W + H_GAP);

        let intraOffset = 0;
        if (
          node.year !== null &&
          Number.isFinite(node.year) &&
          era.minYear !== null &&
          Number.isFinite(era.minYear) &&
          era.maxYear !== null &&
          Number.isFinite(era.maxYear) &&
          era.id !== 'Pre-1900'
        ) {
          const frac = Math.max(0, Math.min(1, (node.year - era.minYear) / 9));
          intraOffset = (frac - 0.5) * 14;
        }

        const totalSubHeight = (numSubRows - 1) * SUBROW_H;
        const rawY =
          bandTop + bandHeight / 2 - totalSubHeight / 2 + subRow * SUBROW_H + intraOffset;

        // Guard against any NaN coordinate propagation ("year": null -> "Undated")
        const x = Number.isFinite(rawX) ? rawX : 0;
        const y = Number.isFinite(rawY) ? rawY : bandTop + bandHeight / 2;

        // Precompute badge & truncated labels (standard & thumbnail-indented) once
        const degText = String(node.degree);
        let badgeW = 22;
        let truncatedLabel = node.label;
        let truncatedLabelThumb = node.label;
        let labelWidth = node.label.length * 6.8;

        if (mCtx) {
          mCtx.font = '600 10px Inter, system-ui, sans-serif';
          badgeW = Math.max(20, mCtx.measureText(degText).width + 10);
          const textMaxW = NODE_W - badgeW - 38;
          const thumbTextMaxW = NODE_W - badgeW - 50;
          mCtx.font = '600 12px Inter, system-ui, sans-serif';
          labelWidth = mCtx.measureText(truncatedLabel).width;

          if (labelWidth > textMaxW) {
            while (
              truncatedLabel.length > 3 &&
              mCtx.measureText(`${truncatedLabel}…`).width > textMaxW
            ) {
              truncatedLabel = truncatedLabel.slice(0, -1);
            }
            truncatedLabel = `${truncatedLabel}…`;
            labelWidth = mCtx.measureText(truncatedLabel).width;
          }

          if (mCtx.measureText(truncatedLabelThumb).width > thumbTextMaxW) {
            while (
              truncatedLabelThumb.length > 3 &&
              mCtx.measureText(`${truncatedLabelThumb}…`).width > thumbTextMaxW
            ) {
              truncatedLabelThumb = truncatedLabelThumb.slice(0, -1);
            }
            truncatedLabelThumb = `${truncatedLabelThumb}…`;
          }
        }

        const tierBonus = node.tier === 1 ? 2.5 : node.tier === 2 ? 1.2 : 0;
        const dotRadius = Math.min(
          13,
          4.2 + Math.sqrt(Math.max(0, node.degree)) * 1.05 + tierBonus
        );

        const pNode: PositionedNode = {
          ...node,
          x,
          y,
          width: NODE_W,
          height: NODE_H,
          dotRadius,
          degText,
          badgeW,
          truncatedLabel,
          truncatedLabelThumb,
          labelWidth,
        };

        positionedNodes.push(pNode);
        positionedMap.set(pNode.id, pNode);

        // Insert into 256x256 spatial hash grid buckets
        const halfW = NODE_W / 2 + 12;
        const halfH = NODE_H / 2 + 12;
        const gx0 = Math.floor((x - halfW) / SPATIAL_CELL_SIZE);
        const gx1 = Math.floor((x + halfW) / SPATIAL_CELL_SIZE);
        const gy0 = Math.floor((y - halfH) / SPATIAL_CELL_SIZE);
        const gy1 = Math.floor((y + halfH) / SPATIAL_CELL_SIZE);
        for (let gx = gx0; gx <= gx1; gx++) {
          for (let gy = gy0; gy <= gy1; gy++) {
            const cellKey = `${gx},${gy}`;
            let cell = spatialGrid.get(cellKey);
            if (!cell) {
              cell = [];
              spatialGrid.set(cellKey, cell);
            }
            cell.push(pNode);
          }
        }

        minX = Math.min(minX, x - NODE_W);
        maxX = Math.max(maxX, x + NODE_W);
      }
    }

    currentY = bandBottom;
  }

  // Precompute Path2D + bounding boxes + endpoint tiers for all visible directed & peer edges
  const layoutDirectedEdges: LayoutEdge[] = [];
  for (const edge of directedEdges) {
    const src = positionedMap.get(edge.source);
    const tgt = positionedMap.get(edge.target);
    if (!src || !tgt) continue;
    const geom = buildCubicBezierPath(src, tgt);
    layoutDirectedEdges.push({
      ...edge,
      ...geom,
      sourceTier: src.tier,
      targetTier: tgt.tier,
    });
  }

  const layoutPeerEdges: LayoutEdge[] = [];
  for (const edge of peerEdges) {
    const src = positionedMap.get(edge.source);
    const tgt = positionedMap.get(edge.target);
    if (!src || !tgt) continue;
    const geom = buildCubicBezierPath(src, tgt);
    layoutPeerEdges.push({
      ...edge,
      ...geom,
      sourceTier: src.tier,
      targetTier: tgt.tier,
    });
  }

  return {
    positionedNodes,
    positionedMap,
    spatialGrid,
    layoutDirectedEdges,
    layoutPeerEdges,
    swimlanes,
    bounds: {
      minX: minX - 180,
      maxX: maxX + 180,
      minY: 40,
      maxY: currentY + 80,
    },
  };
}
