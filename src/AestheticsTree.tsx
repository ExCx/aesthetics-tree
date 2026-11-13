import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeGraphDataset } from './data/normalizeGraph';
import {
  computeFitView,
  computeFocusView,
  createCameraState,
  setCameraTarget,
  snapCamera,
} from './canvas/camera';
import { useCanvasEngine } from './canvas/useCanvasEngine';
import { useCanvasInteractions } from './canvas/useCanvasInteractions';
import { BUTTON_ZOOM_STEP } from './graph/constants';
import { computeChronologicalLayout } from './graph/layout';
import { computeLineage } from './graph/lineage';
import { searchGraph } from './graph/search';
import type {
  CameraState,
  DragState,
  NormalizedGraph,
  NormalizedNode,
  SceneState,
  ToastState,
} from './graph/types';
import { useDatasetSource } from './hooks/useDatasetSource';
import { FilterPanel } from './components/FilterPanel';
import { InspectorDrawer } from './components/InspectorDrawer';
import { MapControls } from './components/MapControls';
import { HoverTooltip, Toast } from './components/Overlays';
import { TopBar } from './components/TopBar';

/**
 * Thin orchestrator: UI state + memoized graph/layout + hook wiring.
 *
 * All rendering, layout math, hit-testing and pointer handling live in
 * `graph/`, `canvas/`, `hooks/` and `components/`. Nothing in this file may
 * copy camera/hover state into React state.
 */
export default function AestheticsTree() {
  // Low-frequency UI State ONLY
  const [toast, setToast] = useState<ToastState | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusLineageOnly, setFocusLineageOnly] = useState<boolean>(false);
  const [hideIsolated, setHideIsolated] = useState<boolean>(false);
  const [showUndated, setShowUndated] = useState<boolean>(false);
  const [showSubgenres, setShowSubgenres] = useState<boolean>(true);
  const [showChronological, setShowChronological] = useState<boolean>(true);
  const [showOverlaps, setShowOverlaps] = useState<boolean>(false);
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Track which selectedId had an image load error in the Inspector Drawer
  const [failedSelectedImageId, setFailedSelectedImageId] = useState<string | null>(null);
  const imgError = Boolean(selectedId && failedSelectedImageId === selectedId);

  // Imperative Refs for Locked-60fps Rendering (Zero React re-renders on pan/zoom/hover/thumbnails)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const zoomTextRef = useRef<HTMLSpanElement | null>(null);

  const cameraRef = useRef<CameraState>(createCameraState());
  const dirtyRef = useRef<boolean>(true);
  const hoveredIdRef = useRef<string | null>(null);

  const dragStateRef = useRef<DragState>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origCamX: 0,
    origCamY: 0,
    pinchDist: 0,
    origCamScale: 1,
  });

  const triggerToast = useCallback(
    (message: string, type: ToastState['type'] = 'info') => {
      setToast({ message, type });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Called by the dataset hook right after normalization so the orchestrator
  // can move UI-only state (selection + filters) in one batch.
  // A freshly loaded dataset starts with nothing selected; selection is user-driven.
  const onDatasetLoaded = useCallback((norm: NormalizedGraph) => {
    setFocusLineageOnly(false);
    setHideIsolated(norm.nodes.length > 100);
    setSelectedId(null);
  }, []);

  const { rawDataset } = useDatasetSource({
    notify: triggerToast,
    dirtyRef,
    onDatasetLoaded,
  });

  // Keyboard shortcuts ('/' to search, 'Escape' to clear)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (searchFocused) {
          setSearchFocused(false);
          searchInputRef.current?.blur();
        } else {
          setSelectedId(null);
          setFocusLineageOnly(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchFocused]);

  // Normalize full graph
  const graph = useMemo(() => normalizeGraphDataset(rawDataset), [rawDataset]);

  // Compute full upstream ancestry, downstream descendants, and lateral peers for selectedId
  const lineage = useMemo(
    () => computeLineage(graph.nodeMap, selectedId),
    [selectedId, graph]
  );

  // Filter nodes before layout
  const filteredNodes = useMemo(() => {
    return graph.nodes.filter((node) => {
      if (!showUndated && node.eraId === 'Undated') return false;
      if (focusLineageOnly && selectedId && lineage.allFamilyNodes.size > 0) {
        return lineage.allFamilyNodes.has(node.id);
      }
      if (hideIsolated && node.degree === 0 && node.id !== selectedId) {
        return false;
      }
      return true;
    });
  }, [graph.nodes, showUndated, focusLineageOnly, selectedId, lineage.allFamilyNodes, hideIsolated]);

  // Precomputed Layout + Path2D + Spatial Hash Grid
  const layout = useMemo(() => {
    return computeChronologicalLayout(
      filteredNodes,
      graph.directedEdges,
      graph.peerEdges,
      showUndated
    );
  }, [filteredNodes, graph.directedEdges, graph.peerEdges, showUndated]);

  // Fit view to bounds
  const fitToScreen = useCallback(
    (animate = true) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const target = computeFitView(layout.bounds, rect, Boolean(selectedId));

      if (animate) {
        setCameraTarget(cameraRef.current, target);
      } else {
        snapCamera(cameraRef.current, target);
        if (zoomTextRef.current) {
          zoomTextRef.current.textContent = `${Math.round(target.scale * 100)}%`;
        }
      }
      dirtyRef.current = true;
    },
    [layout.bounds, selectedId]
  );

  // Smooth pan-to-node
  const focusNode = useCallback(
    (nodeId: string, autoSelect = true) => {
      const targetNode = layout.positionedMap.get(nodeId);
      if (autoSelect) setSelectedId(nodeId);
      if (!targetNode || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const target = computeFocusView(
        targetNode,
        rect,
        cameraRef.current.targetScale
      );
      setCameraTarget(cameraRef.current, target);
      dirtyRef.current = true;
    },
    [layout.positionedMap]
  );

  useEffect(() => {
    fitToScreen(false);
  }, [rawDataset, focusLineageOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Instant search results & search-matched lineage set for progressive-disclosure bypass
  const { searchResults, searchMatchSet } = useMemo(
    () => searchGraph(graph.nodes, searchQuery),
    [searchQuery, graph.nodes]
  );

  // Keep latest render parameters in a ref so the RAF loop never restarts unnecessarily
  const sceneRef = useRef<SceneState>({
    layout,
    selectedId,
    lineage,
    searchMatchSet,
    showSubgenres,
    showChronological,
    showOverlaps,
  });
  useEffect(() => {
    sceneRef.current = {
      layout,
      selectedId,
      lineage,
      searchMatchSet,
      showSubgenres,
      showChronological,
      showOverlaps,
    };
    dirtyRef.current = true;
  }, [layout, selectedId, lineage, searchMatchSet, showSubgenres, showChronological, showOverlaps]);

  useCanvasEngine({
    canvasRef,
    containerRef,
    cameraRef,
    dirtyRef,
    hoveredIdRef,
    zoomTextRef,
    sceneRef,
  });

  const selectNode = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setFocusLineageOnly(false);
  }, []);

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    stepZoom,
  } = useCanvasInteractions({
    canvasRef,
    containerRef,
    tooltipRef,
    zoomTextRef,
    cameraRef,
    dirtyRef,
    hoveredIdRef,
    dragStateRef,
    layout,
    selectedId,
    lineage,
    searchMatchSet,
    onSelectNode: selectNode,
    onClearSelection: clearSelection,
  });

  const handleSelectSearchResult = useCallback(
    (item: NormalizedNode) => {
      setSearchQuery('');
      setSearchFocused(false);
      if (item.eraId === 'Undated') setShowUndated(true);
      if (item.degree === 0) setHideIsolated(false);
      setFocusLineageOnly(false);
      setTimeout(() => focusNode(item.id, true), 30);
    },
    [focusNode]
  );

  const handleInspectorImageError = useCallback(() => {
    if (selectedId) setFailedSelectedImageId(selectedId);
  }, [selectedId]);

  const selectedNode = selectedId ? graph.nodeMap.get(selectedId) ?? null : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-[#090d16] text-slate-100 overflow-hidden select-none font-sans"
    >
      {/* Interactive HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="block w-full h-full touch-none cursor-grab"
      />

      <TopBar
        visibleNodeCount={filteredNodes.length}
        totalNodeCount={graph.nodes.length}
        searchQuery={searchQuery}
        searchFocused={searchFocused}
        searchResults={searchResults}
        searchInputRef={searchInputRef}
        onSearchFocus={() => setSearchFocused(true)}
        onSearchBlur={() => setSearchFocused(false)}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        onSelectSearchResult={handleSelectSearchResult}
      />

      <FilterPanel
        isOpen={showFilterPanel}
        onToggle={() => setShowFilterPanel((v) => !v)}
        hasSelection={Boolean(selectedNode)}
        focusLineageOnly={focusLineageOnly}
        onToggleFocusLineage={() => setFocusLineageOnly((v) => !v)}
        hideIsolated={hideIsolated}
        onHideIsolatedChange={setHideIsolated}
        showUndated={showUndated}
        onShowUndatedChange={setShowUndated}
        showSubgenres={showSubgenres}
        onShowSubgenresChange={setShowSubgenres}
        showChronological={showChronological}
        onShowChronologicalChange={setShowChronological}
        showOverlaps={showOverlaps}
        onShowOverlapsChange={setShowOverlaps}
      />

      <MapControls
        zoomTextRef={zoomTextRef}
        onZoomIn={() => stepZoom(BUTTON_ZOOM_STEP)}
        onZoomOut={() => stepZoom(1 / BUTTON_ZOOM_STEP)}
        onFitView={() => fitToScreen(true)}
      />

      <HoverTooltip tooltipRef={tooltipRef} />

      <InspectorDrawer
        node={selectedNode}
        nodeMap={graph.nodeMap}
        lineage={lineage}
        imageFailed={imgError}
        onImageError={handleInspectorImageError}
        onClose={clearSelection}
        onFocusNode={(id) => focusNode(id, true)}
      />

      <Toast toast={toast} />
    </div>
  );
}
