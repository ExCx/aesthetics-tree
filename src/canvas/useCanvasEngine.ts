import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { CAMERA_EASING } from '../graph/constants';
import type { CameraState, SceneState, ThumbnailLoader } from '../graph/types';
import { createThumbnailLoader } from './imageCache';
import { renderScene } from './renderScene';

export interface UseCanvasEngineArgs {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  cameraRef: RefObject<CameraState>;
  dirtyRef: RefObject<boolean>;
  hoveredIdRef: RefObject<string | null>;
  zoomTextRef: RefObject<HTMLSpanElement | null>;
  sceneRef: RefObject<SceneState>;
}

/**
 * Owns the single dirty-flagged requestAnimationFrame loop.
 *
 * INVARIANTS:
 *   - Mounted exactly once; all inputs are mutable refs, never React state.
 *   - Camera easing runs every frame, but `renderScene` only runs when dirty.
 *   - Nothing in here may call `setState`.
 */
export function useCanvasEngine({
  canvasRef,
  containerRef,
  cameraRef,
  dirtyRef,
  hoveredIdRef,
  zoomTextRef,
  sceneRef,
}: UseCanvasEngineArgs): void {
  // Kept in a ref so React StrictMode's mount/unmount cycle reuses the same
  // thumbnail cache instead of re-downloading every image.
  const loaderRef = useRef<ThumbnailLoader | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    let width = 0;
    let height = 0;
    let rafId: number | null = null;

    if (!loaderRef.current) {
      loaderRef.current = createThumbnailLoader({
        onLoad: () => {
          dirtyRef.current = true;
        },
      });
    }
    const loadThumbnail = loaderRef.current;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirtyRef.current = true;
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Main RAF ticker: interpolates camera smoothly and renders ONLY when dirty
    const tick = () => {
      const cam = cameraRef.current;
      const dx = cam.targetX - cam.x;
      const dy = cam.targetY - cam.y;
      const ds = cam.targetScale - cam.scale;

      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(ds) > 0.0004) {
        cam.x += dx * CAMERA_EASING;
        cam.y += dy * CAMERA_EASING;
        cam.scale += ds * CAMERA_EASING;
        dirtyRef.current = true;
        if (zoomTextRef.current) {
          zoomTextRef.current.textContent = `${Math.round(cam.scale * 100)}%`;
        }
      } else if (dx !== 0 || dy !== 0 || ds !== 0) {
        cam.x = cam.targetX;
        cam.y = cam.targetY;
        cam.scale = cam.targetScale;
        dirtyRef.current = true;
        if (zoomTextRef.current) {
          zoomTextRef.current.textContent = `${Math.round(cam.scale * 100)}%`;
        }
      }

      if (dirtyRef.current) {
        dirtyRef.current = false;
        renderScene({
          ctx,
          width,
          height,
          camera: cam,
          scene: sceneRef.current,
          hoveredId: hoveredIdRef.current,
          loadThumbnail,
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      resizeObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    canvasRef,
    containerRef,
    cameraRef,
    dirtyRef,
    hoveredIdRef,
    zoomTextRef,
    sceneRef,
  ]);
}
