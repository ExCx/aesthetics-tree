import { useMemo } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ExternalLink,
  MapPin,
  Palette,
  Sparkles,
  X,
} from 'lucide-react';
import { parseColourSwatches } from '../graph/colours';
import type { LineageSets, NormalizedNode } from '../graph/types';

export interface InspectorDrawerProps {
  node: NormalizedNode | null;
  nodeMap: Map<string, NormalizedNode>;
  lineage: LineageSets;
  imageFailed: boolean;
  onImageError: () => void;
  onClose: () => void;
  onFocusNode: (id: string) => void;
}

/** Right-hand slide-over inspector for the selected aesthetic. */
export function InspectorDrawer({
  node,
  nodeMap,
  lineage,
  imageFailed,
  onImageError,
  onClose,
  onFocusNode,
}: InspectorDrawerProps) {
  const parsedSwatches = useMemo(
    () => (node ? parseColourSwatches(node.colours) : []),
    [node]
  );

  const motifTags = useMemo(() => {
    if (!node?.motifs) return [];
    return node.motifs
      .split(/[,•;\n]+/)
      .map((m) => m.trim())
      .filter(Boolean)
      .slice(0, 14);
  }, [node]);

  const platformTags = useMemo(() => {
    if (!node?.platform) return [];
    return node.platform
      .split(/[,•;\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [node]);

  return (
    <aside
      className={`absolute top-14 right-0 bottom-0 z-20 w-full sm:w-[390px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800/90 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
        node ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {node && (
        <>
          <div className="relative h-40 w-full shrink-0 overflow-hidden bg-slate-950 border-b border-slate-800">
            {node.image && !imageFailed ? (
              <img
                src={node.image}
                alt={node.label}
                referrerPolicy="no-referrer"
                onError={onImageError}
                className="w-full h-full object-cover object-center opacity-85"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center relative"
                style={{
                  background: `radial-gradient(circle at 25% 25%, ${node.eraColor}44, #090d16 75%)`,
                }}
              >
                <span className="text-5xl font-black tracking-tighter text-white/10 select-none">
                  {node.label.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/75 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 transition-colors"
              title="Close Inspector"
            >
              <X size={16} />
            </button>

            <div className="absolute bottom-3 left-5 right-5">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-950"
                  style={{ backgroundColor: node.eraColor }}
                >
                  {node.eraId}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">
                  Tier {node.tier}
                </span>
                {node.year && (
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    {node.origin_raw || node.year}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-white leading-tight truncate">
                {node.label}
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="text-amber-400 font-semibold">
                  {lineage.ancestorNodes.size} ancestors
                </span>
                <span>•</span>
                <span className="text-cyan-400 font-semibold">
                  {lineage.descendantNodes.size} descendants
                </span>
              </div>
              <a
                href={node.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/40 text-fuchsia-300 text-xs font-semibold transition-colors"
              >
                <span>Aesthetics Wiki</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {(node.location || platformTags.length > 0) && (
              <div className="grid grid-cols-1 gap-2.5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs">
                {node.location && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                        Origin Location
                      </span>
                      <span className="text-slate-200">{node.location}</span>
                    </div>
                  </div>
                )}
                {platformTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {platformTags.map((plat, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-[11px] text-slate-300"
                      >
                        {plat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {node.colours && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Palette size={13} className="text-fuchsia-400" /> Key Colours
                </h3>
                {parsedSwatches.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parsedSwatches.map((sw, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-200"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: sw.hex }}
                        />
                        <span className="capitalize text-[11px]">{sw.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300">{node.colours}</p>
                )}
              </div>
            )}

            {motifTags.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" /> Key Motifs
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {motifTags.map((motif, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs text-slate-200"
                    >
                      {motif}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <ArrowUpRight size={13} /> Influences & Roots ({node.parents.length})
                </h4>
                {node.parents.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {node.parents.map((pId) => {
                      const pNode = nodeMap.get(pId);
                      return (
                        <button
                          key={pId}
                          onClick={() => onFocusNode(pId)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <span>{pNode?.label || pId}</span>
                          {pNode?.year && (
                            <span className="text-[10px] text-amber-400/75">{pNode.year}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Root aesthetic (no earlier links)</p>
                )}
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                  <ArrowDownRight size={13} /> Subgenres & Successors ({node.children.length})
                </h4>
                {node.children.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {node.children.map((cId) => {
                      const cNode = nodeMap.get(cId);
                      return (
                        <button
                          key={cId}
                          onClick={() => onFocusNode(cId)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <span>{cNode?.label || cId}</span>
                          {cNode?.year && (
                            <span className="text-[10px] text-cyan-400/75">{cNode.year}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No recorded downstream branches</p>
                )}
              </div>

              {node.peers.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                    Lateral Overlaps & Peers ({node.peers.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {node.peers.map((peerId) => {
                      const peerNode = nodeMap.get(peerId);
                      return (
                        <button
                          key={peerId}
                          onClick={() => onFocusNode(peerId)}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-medium transition-colors"
                        >
                          {peerNode?.label || peerId}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
