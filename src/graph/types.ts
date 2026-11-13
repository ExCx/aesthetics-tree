/**
 * Shared graph/canvas type contract.
 *
 * This module is a LEAF: it must not import from any other project module so
 * that every layer (data -> graph -> canvas -> components) can depend on it
 * without creating import cycles.
 */

// ============================================================================
// Raw dataset input (loose, comes straight from JSON)
// ============================================================================
export interface RawNodeInput {
  id?: string;
  label?: string;
  title?: string;
  origin_raw?: string;
  year?: number | string | null;
  motifs?: string | string[];
  colours?: string | string[];
  platform?: string | string[];
  location?: string;
  image?: string;
  url?: string;
  pagerank?: number;
  tier?: number;
  subgenres?: string[];
  related?: string[];
  overlaps?: string[];
}

export interface RawEdgeInput {
  source?: string;
  target?: string;
  type?: string;
}

export interface RawDatasetObject {
  stats?: { nodes: number; edges: number };
  nodes?: RawNodeInput[];
  edges?: RawEdgeInput[];
}

export type RawDatasetInput = RawDatasetObject | RawNodeInput[];

// ============================================================================
// Normalized graph
// ============================================================================
export interface NormalizedNode {
  id: string;
  label: string;
  origin_raw: string;
  year: number | null;
  eraId: string;
  eraColor: string;
  motifs: string;
  colours: string;
  platform: string;
  location: string;
  image: string;
  url: string;
  parents: string[];
  children: string[];
  peers: string[];
  degree: number;
  pagerank: number;
  tier: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: 'subgenre' | 'chronological' | 'overlap';
}

export interface NormalizedGraph {
  nodeMap: Map<string, NormalizedNode>;
  nodes: NormalizedNode[];
  directedEdges: GraphEdge[];
  peerEdges: GraphEdge[];
}

// ============================================================================
// Layout artifacts (precomputed once per layout pass, never per frame)
// ============================================================================
export interface PositionedNode extends NormalizedNode {
  x: number;
  y: number;
  width: number;
  height: number;
  dotRadius: number;
  degText: string;
  badgeW: number;
  truncatedLabel: string;
  truncatedLabelThumb: string;
  labelWidth: number;
}

export interface BezierGeometry {
  path: Path2D;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface LayoutEdge extends GraphEdge, BezierGeometry {
  sourceTier: number;
  targetTier: number;
}

export interface Swimlane {
  id: string;
  label: string;
  color: string;
  count: number;
  top: number;
  bottom: number;
  height: number;
}

export interface LayoutBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface LayoutResult {
  positionedNodes: PositionedNode[];
  positionedMap: Map<string, PositionedNode>;
  /** 256×256 spatial hash grid used for O(1) pointer hit-testing. */
  spatialGrid: Map<string, PositionedNode[]>;
  layoutDirectedEdges: LayoutEdge[];
  layoutPeerEdges: LayoutEdge[];
  swimlanes: Swimlane[];
  bounds: LayoutBounds;
}

// ============================================================================
// Lineage / selection / search
// ============================================================================
export interface LineageSets {
  ancestorNodes: Set<string>;
  descendantNodes: Set<string>;
  peerNodes: Set<string>;
  ancestorEdges: Set<string>;
  descendantEdges: Set<string>;
  peerEdgesSet: Set<string>;
  allFamilyNodes: Set<string>;
}

export interface SearchOutcome {
  searchResults: NormalizedNode[];
  searchMatchSet: Set<string>;
}

/** Latest render parameters consumed by the RAF loop via a ref. */
export interface SceneState {
  layout: LayoutResult;
  selectedId: string | null;
  lineage: LineageSets;
  searchMatchSet: Set<string>;
  showSubgenres: boolean;
  showChronological: boolean;
  showOverlaps: boolean;
}

// ============================================================================
// Imperative canvas state
// ============================================================================
export interface CameraState {
  x: number;
  y: number;
  scale: number;
  targetX: number;
  targetY: number;
  targetScale: number;
}

export interface DragState {
  active: boolean;
  moved: boolean;
  startX: number;
  startY: number;
  origCamX: number;
  origCamY: number;
  pinchDist: number;
  origCamScale: number;
}

export interface CachedImageEntry {
  status: 'loading' | 'loaded' | 'error';
  img: HTMLImageElement;
}

/**
 * Lazy Wikia/Fandom thumbnail loader. Returns the image only when it is
 * already decoded; never blocks the draw loop.
 */
export type ThumbnailLoader = (url: string) => HTMLImageElement | null;

/** Mutated in place so the draw loop can avoid redundant globalAlpha writes. */
export interface AlphaState {
  current: number;
}

/** A node title queued for the inverse-zoom screen-space label pass. */
export interface LabelCandidate {
  node: PositionedNode;
  radius: number;
  isSelected: boolean;
  isHovered: boolean;
  isInFamily: boolean;
  isSearchMatch: boolean;
}

// ============================================================================
// UI
// ============================================================================
export interface ToastState {
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface ColorSwatch {
  label: string;
  hex: string;
}
