import { Compass, Eye, Layers, SlidersHorizontal } from 'lucide-react';

export interface FilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  hasSelection: boolean;
  focusLineageOnly: boolean;
  onToggleFocusLineage: () => void;
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

/** Left floating controls: visibility toggles, edge layers, lineage legend. */
export function FilterPanel({
  isOpen,
  onToggle,
  hasSelection,
  focusLineageOnly,
  onToggleFocusLineage,
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
    <aside className="absolute top-16 left-4 z-20 flex flex-col gap-2 max-w-[260px]">
      <button
        onClick={onToggle}
        className="self-start flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 backdrop-blur-md border border-slate-800 text-xs font-semibold text-slate-200 shadow-lg transition-colors"
      >
        <SlidersHorizontal size={13} className="text-fuchsia-400" />
        <span>{isOpen ? 'Hide Controls' : 'Filters & Legend'}</span>
      </button>

      {isOpen && (
        <div className="bg-slate-900/88 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-3.5 shadow-2xl space-y-3.5 text-xs">
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

          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Lineage Legend
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 ring-2 ring-fuchsia-400/30" />
              <span>Selected Aesthetic</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Upstream Ancestors</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Downstream Descendants</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 border-t-2 border-dashed border-purple-400" />
              <span>Lateral Overlaps</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
