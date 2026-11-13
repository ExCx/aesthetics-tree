import {
  CANVAS_BG,
  LANE_BG_EVEN,
  LANE_BG_ODD,
  LANE_DIVIDER,
} from '../graph/constants';
import { DOT_MODE_MAX_ZOOM, THUMBNAIL_MIN_ZOOM } from '../graph/tiering';
import type {
  AlphaState,
  CameraState,
  SceneState,
  ThumbnailLoader,
} from '../graph/types';
import { drawActiveEdges } from './drawEdges';
import { drawDecadeBadges, drawDotLabels } from './drawLabels';
import { drawNodes } from './drawNodes';

export interface RenderSceneArgs {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  camera: CameraState;
  scene: SceneState;
  hoveredId: string | null;
  loadThumbnail: ThumbnailLoader;
}

/**
 * Single frame render.
 *
 * Draw order is part of the UX contract:
 *   1. era swimlanes
 *   2. active lineage / hover / search edges
 *   3. nodes (dots below 80% zoom, pill cards above)
 *   4. inverse-zoom dot titles (screen space)
 *   5. sticky decade badges (screen space)
 *
 * Must stay allocation-light and free of `measureText`.
 */
export function renderScene({
  ctx,
  width,
  height,
  camera,
  scene,
  hoveredId,
  loadThumbnail,
}: RenderSceneArgs): void {
  const k = Number.isFinite(camera.scale) && camera.scale > 0 ? camera.scale : 0.85;
  const camX = Number.isFinite(camera.x) ? camera.x : 0;
  const camY = Number.isFinite(camera.y) ? camera.y : 0;

  const {
    layout,
    selectedId,
    lineage,
    searchMatchSet,
    showSubgenres,
    showChronological,
    showOverlaps,
  } = scene;

  const hoveredNode = hoveredId
    ? layout.positionedMap.get(hoveredId) ?? null
    : null;

  // Solid opaque clear ({ alpha: false })
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, width, height);

  const worldLeft = -camX / k;
  const worldRight = (width - camX) / k;
  const worldTop = -camY / k;
  const worldBottom = (height - camY) / k;

  ctx.save();
  ctx.translate(camX, camY);
  ctx.scale(k, k);
  ctx.globalAlpha = 1;

  // 1) Era Swimlanes (frustum culled)
  for (let i = 0; i < layout.swimlanes.length; i++) {
    const lane = layout.swimlanes[i];
    if (lane.bottom < worldTop - 100 || lane.top > worldBottom + 100) continue;

    ctx.fillStyle = i % 2 === 0 ? LANE_BG_EVEN : LANE_BG_ODD;
    ctx.fillRect(worldLeft - 400, lane.top, worldRight - worldLeft + 800, lane.height);

    ctx.strokeStyle = LANE_DIVIDER;
    ctx.lineWidth = 1 / k;
    ctx.beginPath();
    ctx.moveTo(worldLeft - 400, lane.top);
    ctx.lineTo(worldRight + 400, lane.top);
    ctx.stroke();
  }

  const hasSelection = Boolean(selectedId && layout.positionedMap.has(selectedId));
  const hasSearchMatches = searchMatchSet.size > 0;

  // 2) Active lineage / hover / search edge batches only (no ambient edges)
  const alpha: AlphaState = { current: 1 };
  drawActiveEdges({
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
  });

  // 3) Nodes: dot mode below 80% zoom, pill cards above, thumbnails above 95%
  const isDotMode = k < DOT_MODE_MAX_ZOOM;
  const isHighZoom = k >= THUMBNAIL_MIN_ZOOM;
  const labelCandidates = drawNodes({
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
  });

  ctx.restore();
  ctx.globalAlpha = 1;

  // 4) Inverse-zoom readable node titles above dots (screen space)
  if (isDotMode && labelCandidates.length > 0) {
    drawDotLabels({
      ctx,
      width,
      height,
      k,
      camX,
      camY,
      hasSelection,
      candidates: labelCandidates,
    });
  }

  // 5) Sticky left-edge decade badges (screen space)
  drawDecadeBadges({
    ctx,
    height,
    k,
    camY,
    swimlanes: layout.swimlanes,
  });
}
