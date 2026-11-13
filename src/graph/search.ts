import type { NormalizedNode, SearchOutcome } from './types';

/**
 * Instant fuzzy search across label, motifs, platform and origin string.
 * Returns at most `limit` results plus the id set used for progressive-
 * disclosure bypass and search-lineage edge highlighting.
 */
export function searchGraph(
  nodes: NormalizedNode[],
  query: string,
  limit = 12
): SearchOutcome {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { searchResults: [], searchMatchSet: new Set<string>() };
  }

  const matches: Array<{ node: NormalizedNode; score: number }> = [];
  for (const node of nodes) {
    const inLabel = node.label.toLowerCase().includes(q);
    const inMotifs = node.motifs.toLowerCase().includes(q);
    const inPlatform = node.platform.toLowerCase().includes(q);
    const inOrigin = node.origin_raw.toLowerCase().includes(q);
    if (inLabel || inMotifs || inPlatform || inOrigin) {
      matches.push({
        node,
        score: inLabel ? (node.label.toLowerCase().startsWith(q) ? 3 : 2) : 1,
      });
    }
  }
  matches.sort(
    (a, b) =>
      b.score - a.score ||
      a.node.tier - b.node.tier ||
      b.node.pagerank - a.node.pagerank ||
      b.node.degree - a.node.degree
  );
  const topNodes = matches.slice(0, limit).map((m) => m.node);
  const matchIds = new Set<string>(topNodes.map((n) => n.id));
  return { searchResults: topNodes, searchMatchSet: matchIds };
}
