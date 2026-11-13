import type { RefObject } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import type { ToastState } from '../graph/types';

export interface HoverTooltipProps {
  tooltipRef: RefObject<HTMLDivElement | null>;
}

/**
 * Imperative zero-rerender hover tooltip shell. `useCanvasInteractions` writes
 * directly into the `data-tip-*` children; this component never re-renders on
 * pointer movement.
 */
export function HoverTooltip({ tooltipRef }: HoverTooltipProps) {
  return (
    <div
      ref={tooltipRef}
      style={{ opacity: 0, pointerEvents: 'none', top: 0, left: 0 }}
      className="fixed z-40 px-3 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-2xl max-w-xs transition-opacity duration-75 will-change-transform"
    >
      <div className="flex items-center gap-2">
        <span data-tip-dot className="w-2.5 h-2.5 rounded-full shrink-0" />
        <span data-tip-title className="text-xs font-bold text-white truncate" />
      </div>
      <div data-tip-meta className="text-[11px] text-slate-400 mt-1" />
    </div>
  );
}

export interface ToastProps {
  toast: ToastState | null;
}

/** Non-blocking status toast. */
export function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium transition-all ${
        toast.type === 'error'
          ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          : 'bg-slate-900/95 border-slate-700 text-slate-100'
      }`}
    >
      {toast.type === 'error' ? (
        <AlertCircle size={15} className="text-rose-400 shrink-0" />
      ) : (
        <Sparkles size={15} className="text-fuchsia-400 shrink-0" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}
