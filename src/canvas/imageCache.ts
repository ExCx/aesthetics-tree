import type { CachedImageEntry, ThumbnailLoader } from '../graph/types';

export interface ThumbnailLoaderOptions {
  /** Maximum simultaneous in-flight requests; protects the draw loop. */
  maxConcurrent?: number;
  /** Called once per successful decode so the caller can flag a redraw. */
  onLoad?: () => void;
}

/**
 * Lazy Fandom/Wikia CDN thumbnail loader.
 *
 * INVARIANT (do not change):
 *   - `img.referrerPolicy = 'no-referrer'` is required by the Wikia CDN.
 *   - `img.crossOrigin` must NEVER be set: Wikia's CDN fails CORS preflight,
 *     and canvas pixel readback is not used anywhere in this app.
 *
 * Never blocks: returns the image only once it is fully decoded.
 */
export function createThumbnailLoader({
  maxConcurrent = 8,
  onLoad,
}: ThumbnailLoaderOptions = {}): ThumbnailLoader {
  const cache = new Map<string, CachedImageEntry>();
  let activeLoads = 0;

  return (url: string): HTMLImageElement | null => {
    if (!url) return null;
    const existing = cache.get(url);
    if (existing) {
      return existing.status === 'loaded' ? existing.img : null;
    }

    if (activeLoads >= maxConcurrent) {
      return null;
    }

    activeLoads += 1;
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    const entry: CachedImageEntry = { status: 'loading', img };
    cache.set(url, entry);

    img.onload = () => {
      activeLoads = Math.max(0, activeLoads - 1);
      entry.status = 'loaded';
      onLoad?.();
    };
    img.onerror = () => {
      activeLoads = Math.max(0, activeLoads - 1);
      entry.status = 'error';
    };
    img.src = url;
    return null;
  };
}
