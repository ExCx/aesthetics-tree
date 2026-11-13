import type { RefObject } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

export interface MapControlsProps {
  zoomTextRef: RefObject<HTMLSpanElement | null>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

/** Bottom-left zoom / fit-view cluster. The readout is updated imperatively. */
export function MapControls({
  zoomTextRef,
  onZoomIn,
  onZoomOut,
  onFitView,
}: MapControlsProps) {
  return (
    <div className="absolute bottom-5 left-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
        title="Zoom In"
      >
        <ZoomIn size={16} />
      </button>
      <span
        ref={zoomTextRef}
        className="text-[11px] font-mono text-slate-400 px-1.5 min-w-[44px] text-center"
      >
        85%
      </span>
      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
        title="Zoom Out"
      >
        <ZoomOut size={16} />
      </button>
      <div className="w-px h-5 bg-slate-800 mx-0.5" />
      <button
        onClick={onFitView}
        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
        title="Fit View"
      >
        <Maximize2 size={14} />
        <span className="hidden sm:inline">Fit View</span>
      </button>
    </div>
  );
}
