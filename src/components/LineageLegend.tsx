/**
 * Always-visible lineage key, rendered in the top bar next to the node counter.
 *
 * Deliberately NOT collapsible: the colour language is needed while reading the
 * canvas, so it stays on screen even when the filter panel is closed.
 */
export function LineageLegend() {
  return (
    <div
      aria-label="Lineage legend"
      className="hidden shrink-0 grid-cols-2 gap-x-3 gap-y-0.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-[10px] font-medium leading-none text-slate-300 lg:grid"
    >
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-fuchsia-400 ring-2 ring-fuchsia-400/30" />
        <span className="truncate">Selected</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
        <span className="truncate">Ancestors</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400" />
        <span className="truncate">Descendants</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="flex h-2.5 w-2.5 shrink-0 items-center">
          <span className="w-2.5 border-t-2 border-dashed border-purple-400" />
        </span>
        <span className="truncate">Overlaps</span>
      </div>
    </div>
  );
}
