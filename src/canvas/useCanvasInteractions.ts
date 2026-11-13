import { useCallback, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent, RefObject, TouchEvent as ReactTouchEvent } from 'react';
import { WHEEL_ZOOM_STEP } from '../graph/constants';
import type {
  CameraState,
  DragState,
  LayoutResult,
  LineageSets,
  PositionedNode,
} from '../graph/types';
import { zoomCameraAt } from './camera';
import { findNodeAtScreenPos } from './hitTest';

export interface UseCanvasInteractionsArgs {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  tooltipRef: RefObject<HTMLDivElement | null>;
  zoomTextRef: RefObject<HTMLSpanElement | null>;
  cameraRef: RefObject<CameraState>;
  dirtyRef: RefObject<boolean>;
  hoveredIdRef: RefObject<string | null>;
  dragStateRef: RefObject<DragState>;
  layout: LayoutResult;
  selectedId: string | null;
  lineage: LineageSets;
  searchMatchSet: Set<string>;
  onSelectNode: (id: string) => void;
  onClearSelection: () => void;
}

export interface CanvasInteractionHandlers {
  handlePointerDown: (e: ReactMouseEvent<HTMLCanvasElement>) => void;
  handlePointerMove: (e: ReactMouseEvent<HTMLCanvasElement>) => void;
  handlePointerUp: (e: ReactMouseEvent<HTMLCanvasElement>) => void;
  handlePointerLeave: () => void;
  handleTouchStart: (e: ReactTouchEvent<HTMLCanvasElement>) => void;
  handleTouchMove: (e: ReactTouchEvent<HTMLCanvasElement>) => void;
  handleTouchEnd: (e: ReactTouchEvent<HTMLCanvasElement>) => void;
  stepZoom: (multiplier: number) => void;
}

/**
 * Imperative pointer/touch interaction layer.
 *
 * Pan, pinch, wheel zoom and hover all mutate `cameraRef` / `dragStateRef` /
 * `hoveredIdRef` and set `dirtyRef`, deliberately never calling `setState`
 * (except when a click resolves to a selection change).
 */
export function useCanvasInteractions({
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
  onSelectNode,
  onClearSelection,
}: UseCanvasInteractionsArgs): CanvasInteractionHandlers {
  const hitTest = useCallback(
    (clientX: number, clientY: number): PositionedNode | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return findNodeAtScreenPos({
        clientX,
        clientY,
        canvas,
        camera: cameraRef.current,
        layout,
        selectedId,
        lineage,
        searchMatchSet,
      });
    },
    [canvasRef, cameraRef, layout, selectedId, lineage, searchMatchSet]
  );

  // Imperatively show/hide floating hover tooltip without triggering React state
  const updateHoverTooltip = useCallback(
    (node: PositionedNode | null, clientX: number, clientY: number) => {
      const tip = tooltipRef.current;
      const canvas = canvasRef.current;
      if (!tip) return;

      if (!node) {
        tip.style.opacity = '0';
        tip.style.pointerEvents = 'none';
        if (canvas) canvas.style.cursor = dragStateRef.current.active ? 'grabbing' : 'grab';
        return;
      }

      if (canvas) canvas.style.cursor = 'pointer';
      const left = Math.min(window.innerWidth - 250, clientX + 14);
      const top = Math.min(window.innerHeight - 95, clientY + 14);
      tip.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      tip.style.opacity = '1';

      const dotEl = tip.querySelector<HTMLElement>('[data-tip-dot]');
      const titleEl = tip.querySelector<HTMLElement>('[data-tip-title]');
      const metaEl = tip.querySelector<HTMLElement>('[data-tip-meta]');
      if (dotEl) dotEl.style.backgroundColor = node.eraColor;
      if (titleEl) titleEl.textContent = node.label;
      if (metaEl) {
        metaEl.textContent = `Tier ${node.tier} • ${node.origin_raw || node.eraId} • ${node.parents.length} roots · ${node.children.length} branches`;
      }
    },
    [canvasRef, tooltipRef, dragStateRef]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      zoomCameraAt(
        cameraRef.current,
        mouseX,
        mouseY,
        e.deltaY < 0 ? WHEEL_ZOOM_STEP : 1 / WHEEL_ZOOM_STEP
      );
      dirtyRef.current = true;
    },
    [canvasRef, cameraRef, dirtyRef]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [canvasRef, handleWheel]);

  const handlePointerDown = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const cam = cameraRef.current;
      dragStateRef.current = {
        active: true,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        origCamX: cam.x,
        origCamY: cam.y,
        pinchDist: 0,
        origCamScale: cam.scale,
      };
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    },
    [cameraRef, dragStateRef, canvasRef]
  );

  const handlePointerMove = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const drag = dragStateRef.current;
      if (drag.active) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          drag.moved = true;
        }
        const nx = drag.origCamX + dx;
        const ny = drag.origCamY + dy;
        cameraRef.current.x = nx;
        cameraRef.current.y = ny;
        cameraRef.current.targetX = nx;
        cameraRef.current.targetY = ny;
        dirtyRef.current = true;

        if (hoveredIdRef.current !== null) {
          hoveredIdRef.current = null;
          updateHoverTooltip(null, 0, 0);
        }
        return;
      }

      const hit = hitTest(e.clientX, e.clientY);
      const nextHoverId = hit ? hit.id : null;
      if (nextHoverId !== hoveredIdRef.current) {
        hoveredIdRef.current = nextHoverId;
        dirtyRef.current = true;
      }
      updateHoverTooltip(hit, e.clientX, e.clientY);
    },
    [cameraRef, dirtyRef, dragStateRef, hitTest, hoveredIdRef, updateHoverTooltip]
  );

  const handlePointerUp = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const drag = dragStateRef.current;
      const wasClick = drag.active && !drag.moved;
      drag.active = false;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = hoveredIdRef.current ? 'pointer' : 'grab';
      }

      if (wasClick) {
        const hit = hitTest(e.clientX, e.clientY);
        if (hit) {
          onSelectNode(hit.id);
        } else {
          onClearSelection();
        }
      }
    },
    [canvasRef, dragStateRef, hitTest, hoveredIdRef, onSelectNode, onClearSelection]
  );

  const handlePointerLeave = useCallback(() => {
    dragStateRef.current.active = false;
    if (hoveredIdRef.current !== null) {
      hoveredIdRef.current = null;
      dirtyRef.current = true;
    }
    updateHoverTooltip(null, 0, 0);
  }, [dirtyRef, dragStateRef, hoveredIdRef, updateHoverTooltip]);

  const handleTouchStart = useCallback(
    (e: ReactTouchEvent<HTMLCanvasElement>) => {
      const cam = cameraRef.current;
      if (e.touches.length === 1) {
        const t = e.touches[0];
        dragStateRef.current = {
          active: true,
          moved: false,
          startX: t.clientX,
          startY: t.clientY,
          origCamX: cam.x,
          origCamY: cam.y,
          pinchDist: 0,
          origCamScale: cam.scale,
        };
      } else if (e.touches.length === 2) {
        const [t1, t2] = [e.touches[0], e.touches[1]];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        dragStateRef.current = {
          active: true,
          moved: true,
          startX: (t1.clientX + t2.clientX) / 2,
          startY: (t1.clientY + t2.clientY) / 2,
          origCamX: cam.x,
          origCamY: cam.y,
          pinchDist: dist,
          origCamScale: cam.scale,
        };
      }
    },
    [cameraRef, dragStateRef]
  );

  const handleTouchMove = useCallback(
    (e: ReactTouchEvent<HTMLCanvasElement>) => {
      const drag = dragStateRef.current;
      if (!drag.active) return;
      if (e.touches.length === 1 && drag.pinchDist === 0) {
        const t = e.touches[0];
        const dx = t.clientX - drag.startX;
        const dy = t.clientY - drag.startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) drag.moved = true;
        const nx = drag.origCamX + dx;
        const ny = drag.origCamY + dy;
        cameraRef.current.x = nx;
        cameraRef.current.y = ny;
        cameraRef.current.targetX = nx;
        cameraRef.current.targetY = ny;
        dirtyRef.current = true;
      } else if (e.touches.length === 2 && drag.pinchDist > 0) {
        const [t1, t2] = [e.touches[0], e.touches[1]];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const scaleFactor = dist / drag.pinchDist;
        const newScale = Math.max(
          0.14,
          Math.min(3.5, drag.origCamScale * scaleFactor)
        );
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const worldX = (drag.startX - drag.origCamX) / drag.origCamScale;
        const worldY = (drag.startY - drag.origCamY) / drag.origCamScale;
        const nx = midX - worldX * newScale;
        const ny = midY - worldY * newScale;
        cameraRef.current = {
          x: nx,
          y: ny,
          scale: newScale,
          targetX: nx,
          targetY: ny,
          targetScale: newScale,
        };
        if (zoomTextRef.current) {
          zoomTextRef.current.textContent = `${Math.round(newScale * 100)}%`;
        }
        dirtyRef.current = true;
      }
    },
    [cameraRef, dirtyRef, dragStateRef, zoomTextRef]
  );

  const handleTouchEnd = useCallback(
    (e: ReactTouchEvent<HTMLCanvasElement>) => {
      const drag = dragStateRef.current;
      if (drag.active && !drag.moved && e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        const hit = hitTest(t.clientX, t.clientY);
        if (hit) {
          onSelectNode(hit.id);
        } else {
          onClearSelection();
        }
      }
      drag.active = false;
    },
    [dragStateRef, hitTest, onSelectNode, onClearSelection]
  );

  const stepZoom = useCallback(
    (multiplier: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      zoomCameraAt(cameraRef.current, rect.width / 2, rect.height / 2, multiplier);
      dirtyRef.current = true;
    },
    [containerRef, cameraRef, dirtyRef]
  );

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    stepZoom,
  };
}
