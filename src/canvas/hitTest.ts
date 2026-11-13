import { SPATIAL_CELL_SIZE } from '../graph/constants';
import { DOT_MODE_MAX_ZOOM, getNodeTierAlpha } from '../graph/tiering';
import type {
  CameraState,
  LayoutResult,
  LineageSets,
  PositionedNode,
} from '../graph/types';

export interface HitTestArgs {
  clientX: number;
  clientY: number;
  canvas: HTMLCanvasElement;
  camera: CameraState;
  layout: LayoutResult;
  selectedId: string | null;
  lineage: LineageSets;
  searchMatchSet: Set<string>;
}

/**
 * O(1) spatial-hash hit-testing.
 *
 * Culling parity with the renderer:
 *   - same `getNodeTierAlpha` ladder (tier 1-4 vs. zoom `k`);
 *   - same dot/card switch at `DOT_MODE_MAX_ZOOM`;
 *   - same "important" bypass set (selected + lineage + search matches).
 *
 * The renderer additionally bypasses the *hovered* node and its direct
 * neighbours; that is deliberately omitted here because hover cannot depend on
 * the result of the hit-test.
 */
export function findNodeAtScreenPos({
  clientX,
  clientY,
  canvas,
  camera,
  layout,
  selectedId,
  lineage,
  searchMatchSet,
}: HitTestArgs): PositionedNode | null {
  const rect = canvas.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;

  const { x: camX, y: camY, scale: k } = camera;
  const wx = (sx - camX) / k;
  const wy = (sy - camY) / k;
  const isDotMode = k < DOT_MODE_MAX_ZOOM;

  // Query only the 1 spatial grid bucket under the cursor (O(1))
  const gx = Math.floor(wx / SPATIAL_CELL_SIZE);
  const gy = Math.floor(wy / SPATIAL_CELL_SIZE);
  const bucket = layout.spatialGrid.get(`${gx},${gy}`);
  if (!bucket || bucket.length === 0) return null;

  let fallbackHit: PositionedNode | null = null;
  for (let i = bucket.length - 1; i >= 0; i--) {
    const node = bucket[i];
    const isImportant =
      node.id === selectedId ||
      lineage.allFamilyNodes.has(node.id) ||
      searchMatchSet.has(node.id);

    // Respect zoom-based tier culling during pointer hit-testing
    if (getNodeTierAlpha(node.tier, k, isImportant) <= 0.05) {
      continue;
    }

    let isHit: boolean;
    if (isDotMode) {
      const hitR = Math.max(12 / k, node.dotRadius + 4);
      const dx = wx - node.x;
      const dy = wy - node.y;
      isHit = dx * dx + dy * dy <= hitR * hitR;
    } else {
      const halfW = node.width / 2 + 3;
      const halfH = node.height / 2 + 3;
      isHit =
        wx >= node.x - halfW &&
        wx <= node.x + halfW &&
        wy >= node.y - halfH &&
        wy <= node.y + halfH;
    }

    if (isHit) {
      if (isImportant) return node;
      if (!fallbackHit) fallbackHit = node;
    }
  }

  return fallbackHit;
}
