import type { RefObject } from 'react';
import { GitBranch, Search, X } from 'lucide-react';
import type { NormalizedNode } from '../graph/types';
import { LineageLegend } from './LineageLegend';

export interface TopBarProps {
  visibleNodeCount: number;
  totalNodeCount: number;
  searchQuery: string;
  searchFocused: boolean;
  searchResults: NormalizedNode[];
  searchInputRef: RefObject<HTMLInputElement | null>;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onSelectSearchResult: (node: NormalizedNode) => void;
}

/** Top header: brand, instant search dropdown, visible-node counter. */
export function TopBar({
  visibleNodeCount,
  totalNodeCount,
  searchQuery,
  searchFocused,
  searchResults,
  searchInputRef,
  onSearchFocus,
  onSearchBlur,
  onSearchChange,
  onClearSearch,
  onSelectSearchResult,
}: TopBarProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 h-14 px-4 bg-[#090d16]/85 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
            <GitBranch size={17} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-extrabold tracking-tight text-white leading-none">
              Aesthetics<span className="text-fuchsia-400">Wiki</span>
            </h1>
            <span className="text-[11px] text-slate-400 font-medium">
              Chronological Tree Explorer
            </span>
          </div>
        </div>
      </div>

      {/* Instant Search Input */}
      <div className="relative flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={onSearchFocus}
            onBlur={() => setTimeout(onSearchBlur, 180)}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search aesthetics, motifs, platforms... ( / )"
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-slate-900/95 border border-slate-700/80 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/70 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className="absolute right-2.5 text-slate-500 hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {searchFocused && searchQuery.trim() !== '' && (
          <div className="absolute top-11 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                No aesthetics matching "{searchQuery}"
              </div>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectSearchResult(item);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/90 border-b border-slate-800/60 last:border-none flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.eraColor }}
                      />
                      <span className="text-sm font-semibold text-white truncate">
                        {item.label}
                      </span>
                    </div>
                    {item.motifs && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 pl-4">
                        {item.motifs}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium text-slate-300">
                      {item.year ?? 'Undated'}
                    </span>
                    <span className="text-[11px] text-slate-500">{item.degree} links</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <LineageLegend />
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <span className="text-slate-400">
            {visibleNodeCount.toLocaleString()}/{totalNodeCount.toLocaleString()} nodes
          </span>
        </div>
      </div>
    </header>
  );
}
