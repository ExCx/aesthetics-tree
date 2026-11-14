import { Compass, Eye, Layers, Network, SlidersHorizontal } from 'lucide-react';
import {
  LINEAGE_DEPTH_MAX_OPTION,
  lineageDepthToOption,
  optionToLineageDepth,
} from '../graph/lineage';

export interface FilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  hasSelection: boolean;
  focusLineageOnly: boolean;
  onToggleFocusLineage: () => void;
  lineageDepth: number;
  onLineageDepthChange: (depth: number) => void;
  hideIsolated: boolean;
  onHideIsolatedChange: (value: boolean) => void;
  showUndated: boolean;
  onShowUndatedChange: (value: boolean) => void;
  showSubgenres: boolean;
  onShowSubgenresChange: (value: boolean) => void;
  showChronological: boolean;
  onShowChronologicalChange: (value: boolean) => void;
  showOverlaps: boolean;
  onShowOverlapsChange: (value: boolean) => void;
}

/**
 * Left floating controls: a filter toggle with the collapsible filter body
 * underneath. The column is height-bounded so the body scrolls instead of
 * overlapping the zoom controls.
 */
export function FilterPanel({
  isOpen,
  onToggle,
  hasSelection,
  focusLineageOnly,
  onToggleFocusLineage,
  lineageDepth,
  onLineageDepthChange,
  hideIsolated,
  onHideIsolatedChange,
  showUndated,
  onShowUndatedChange,
  showSubgenres,
  onShowSubgenresChange,
  showChronological,
  onShowChronologicalChange,
  showOverlaps,
  onShowOverlapsChange,
}: FilterPanelProps) {
  return (
    <aside className="pointer-events-none absolute top-16 bottom-[5.5rem] left-4 z-20 flex max-w-[320px] flex-col items-start gap-2">
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          onClick={onToggle}
          className="flex shrink-0 items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 backdrop-blur-md border border-slate-800 text-xs font-semibold text-slate-200 shadow-lg transition-colors"
        >
          <SlidersHorizontal size={13} className="text-fuchsia-400" />
          <span>{isOpen ? 'Hide Filters' : 'Filters'}</span>
        </button>
      </div>

      {isOpen && (
        <div className="pointer-events-auto w-[260px] min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-slate-900/88 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-3.5 shadow-2xl space-y-3.5 text-xs [scrollbar-width:thin] [scrollbar-color:rgba(51,65,85,0.9)_transparent]">
          <div>
            <button
              disabled={!hasSelection}
              onClick={onToggleFocusLineage}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                !hasSelection
                  ? 'bg-slate-950/60 text-slate-600 border border-slate-800/60 cursor-not-allowed'
                  : focusLineageOnly
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50 shadow-inner'
                  : 'bg-slate-950 hover:bg-slate-800/80 text-slate-200 border border-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Compass
                  size={14}
                  className={focusLineageOnly ? 'text-fuchsia-400' : 'text-slate-400'}
                />
                Focus Lineage Only
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                  focusLineageOnly ? 'bg-fuchsia-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {focusLineageOnly ? 'On' : 'Off'}
              </span>
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Network size={11} /> Lineage Depth
              </div>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  hasSelection
                    ? 'bg-slate-800 text-fuchsia-300'
                    : 'bg-slate-950 text-slate-600'
                }`}
              >
                {Number.isFinite(lineageDepth) ? `${lineageDepth} hop${lineageDepth === 1 ? '' : 's'}` : 'All'}
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={LINEAGE_DEPTH_MAX_OPTION + 1}
              step={1}
              value={lineageDepthToOption(lineageDepth)}
              disabled={!hasSelection}
              onChange={(e) => onLineageDepthChange(optionToLineageDepth(Number(e.target.value)))}
              aria-label="Lineage highlight depth"
              aria-valuetext={
                Number.isFinite(lineageDepth)
                  ? `${lineageDepth} hop${lineageDepth === 1 ? '' : 's'}`
                  : 'All hops'
              }
              className="w-full h-1.5 accent-fuchsia-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            />

            <div className="flex justify-between px-0.5 text-[10px] font-medium">
              {[1, 2, 3, 4].map((option) => (
                <span
                  key={option}
                  className={
                    lineageDepthToOption(lineageDepth) === option && hasSelection
                      ? 'text-fuchsia-300'
                      : 'text-slate-500'
                  }
                >
                  {option}
                </span>
              ))}
              <span
                className={
                  lineageDepthToOption(lineageDepth) === LINEAGE_DEPTH_MAX_OPTION + 1 && hasSelection
                    ? 'text-fuchsia-300'
                    : 'text-slate-500'
                }
              >
                All
              </span>
            </div>

            <p className="text-[10px] leading-relaxed text-slate-500">
              Hops of roots &amp; successors to spotlight from the selected aesthetic.
            </p>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye size={11} /> Node Visibility
            </div>

            <label className="flex items-center justify-between cursor-pointer py-0.5 text-slate-300 hover:text-white">
              <span>Hide Isolated</span>
              <input
                type="checkbox"
                checked={hideIsolated}
                onChange={(e) => onHideIsolatedChange(e.target.checked)}
                className="accent-fuchsia-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-0.5 text-slate-300 hover:text-white">
              <span>Undated</span>
              <input
                type="checkbox"
                checked={showUndated}
                onChange={(e) => onShowUndatedChange(e.target.checked)}
                className="accent-fuchsia-500 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers size={11} /> Edge Layers
            </div>

            <label className="flex items-center justify-between cursor-pointer py-0.5 text-slate-300 hover:text-white">
              <span>Subgenres</span>
              <input
                type="checkbox"
                checked={showSubgenres}
                onChange={(e) => onShowSubgenresChange(e.target.checked)}
                className="accent-cyan-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-0.5 text-slate-300 hover:text-white">
              <span>Chronological Links</span>
              <input
                type="checkbox"
                checked={showChronological}
                onChange={(e) => onShowChronologicalChange(e.target.checked)}
                className="accent-amber-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-0.5 text-slate-300 hover:text-white">
              <span>Lateral Overlaps</span>
              <input
                type="checkbox"
                checked={showOverlaps}
                onChange={(e) => onShowOverlapsChange(e.target.checked)}
                className="accent-purple-400 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}
    </aside>
  );
}
