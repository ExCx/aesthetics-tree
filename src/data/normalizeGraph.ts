import type {
  GraphEdge,
  NormalizedGraph,
  NormalizedNode,
  RawDatasetInput,
  RawEdgeInput,
  RawNodeInput,
} from '../graph/types';
import { ERA_COLOR_MAP, getEraBucketId } from '../graph/eras';

/**
 * Normalizes both supported dataset shapes into one graph:
 *   - `{ nodes: [...], edges: [...] }` (scraper output)
 *   - flat `[...]` node arrays with inline `subgenres` / `related` / `overlaps`
 *
 * Edge classification:
 *   - `subgenre`     -> directed parent -> child
 *   - `related`      -> directed older -> newer (undirected when either year is null)
 *   - `overlap`/other -> lateral peer pair
 *
 * When no node carries an explicit tier, PageRank tiers 1-4 are derived from
 * degree/PageRank percentiles so the LOD renderer always has tiers to work with.
 */
export function normalizeGraphDataset(rawJson: RawDatasetInput): NormalizedGraph {
  const rawNodes: RawNodeInput[] = Array.isArray(rawJson)
    ? rawJson
    : Array.isArray(rawJson?.nodes)
    ? rawJson.nodes
    : [];
  const rawEdges: RawEdgeInput[] =
    !Array.isArray(rawJson) && Array.isArray(rawJson?.edges) ? rawJson.edges : [];

  const nodeMap = new Map<string, NormalizedNode>();
  let hasExplicitTiers = true;

  for (const item of rawNodes) {
    if (!item) continue;
    const rawId = item.id ?? item.label ?? item.title;
    if (!rawId) continue;
    const id = String(rawId).trim();
    if (!id || nodeMap.has(id)) continue;

    let parsedYear: number | null = null;
    if (
      item.year !== null &&
      item.year !== undefined &&
      item.year !== '' &&
      Number.isFinite(Number(item.year))
    ) {
      parsedYear = Number(item.year);
    } else if (typeof item.origin_raw === 'string') {
      const m = item.origin_raw.match(/(1[6-9]\d{2}|20[0-2]\d)/);
      if (m && Number.isFinite(Number(m[1]))) parsedYear = Number(m[1]);
    }

    const rawPr = Number(item.pagerank);
    const validPr = Number.isFinite(rawPr) && rawPr > 0 ? rawPr : 0;

    const rawTier = Number(item.tier);
    const validTier =
      rawTier === 1 || rawTier === 2 || rawTier === 3 || rawTier === 4 ? rawTier : 0;
    if (validTier === 0) hasExplicitTiers = false;

    const eraId = getEraBucketId(parsedYear);
    nodeMap.set(id, {
      id,
      label: String(item.label || item.title || id),
      origin_raw: item.origin_raw || (parsedYear !== null ? `${parsedYear}` : 'Unknown Era'),
      year: parsedYear,
      eraId,
      eraColor: ERA_COLOR_MAP[eraId] || '#64748b',
      motifs: Array.isArray(item.motifs) ? item.motifs.join(', ') : item.motifs || '',
      colours: Array.isArray(item.colours) ? item.colours.join(', ') : item.colours || '',
      platform: Array.isArray(item.platform) ? item.platform.join(', ') : item.platform || '',
      location: item.location || '',
      image: item.image || '',
      url:
        item.url ||
        `https://aesthetics.fandom.com/wiki/${encodeURIComponent(id.replace(/ /g, '_'))}`,
      parents: [],
      children: [],
      peers: [],
      degree: 0,
      pagerank: validPr,
      tier: validTier || 4,
    });
  }

  // Build unified edge list from explicit edges array OR inline node arrays
  const combinedRawEdges: RawEdgeInput[] = [...rawEdges];
  if (rawEdges.length === 0) {
    for (const item of rawNodes) {
      const src = item?.id ?? item?.label ?? item?.title;
      if (!src) continue;
      if (Array.isArray(item.subgenres)) {
        for (const tgt of item.subgenres) {
          combinedRawEdges.push({ source: src, target: tgt, type: 'subgenre' });
        }
      }
      if (Array.isArray(item.related)) {
        for (const tgt of item.related) {
          combinedRawEdges.push({ source: src, target: tgt, type: 'related' });
        }
      }
      if (Array.isArray(item.overlaps)) {
        for (const tgt of item.overlaps) {
          combinedRawEdges.push({ source: src, target: tgt, type: 'overlap' });
        }
      }
    }
  }

  const directedEdges: GraphEdge[] = [];
  const peerEdges: GraphEdge[] = [];
  const seenDirected = new Set<string>();
  const seenPeers = new Set<string>();

  for (const edge of combinedRawEdges) {
    if (!edge || !edge.source || !edge.target) continue;
    const srcId = String(edge.source).trim();
    const tgtId = String(edge.target).trim();
    if (!srcId || !tgtId || srcId === tgtId) continue;

    const srcNode = nodeMap.get(srcId);
    const tgtNode = nodeMap.get(tgtId);
    if (!srcNode || !tgtNode) continue;

    const rawType = String(edge.type || 'related').toLowerCase();

    if (rawType === 'subgenre') {
      const key = `${srcId}->${tgtId}`;
      if (!seenDirected.has(key)) {
        seenDirected.add(key);
        directedEdges.push({ id: key, source: srcId, target: tgtId, kind: 'subgenre' });
        srcNode.children.push(tgtId);
        tgtNode.parents.push(srcId);
      }
    } else if (rawType === 'related') {
      const yA = srcNode.year;
      const yB = tgtNode.year;
      if (
        yA !== null &&
        yB !== null &&
        Number.isFinite(yA) &&
        Number.isFinite(yB) &&
        yA !== yB
      ) {
        const older = yA < yB ? srcNode : tgtNode;
        const newer = yA < yB ? tgtNode : srcNode;
        const key = `${older.id}->${newer.id}`;
        if (!seenDirected.has(key)) {
          seenDirected.add(key);
          directedEdges.push({
            id: key,
            source: older.id,
            target: newer.id,
            kind: 'chronological',
          });
          older.children.push(newer.id);
          newer.parents.push(older.id);
        }
      } else {
        const pairKey = srcId < tgtId ? `${srcId}<->${tgtId}` : `${tgtId}<->${srcId}`;
        if (!seenPeers.has(pairKey)) {
          seenPeers.add(pairKey);
          peerEdges.push({ id: pairKey, source: srcId, target: tgtId, kind: 'overlap' });
          srcNode.peers.push(tgtId);
          tgtNode.peers.push(srcId);
        }
      }
    } else {
      const pairKey = srcId < tgtId ? `${srcId}<->${tgtId}` : `${tgtId}<->${srcId}`;
      if (!seenPeers.has(pairKey)) {
        seenPeers.add(pairKey);
        peerEdges.push({ id: pairKey, source: srcId, target: tgtId, kind: 'overlap' });
        srcNode.peers.push(tgtId);
        tgtNode.peers.push(srcId);
      }
    }
  }

  const allNodes = Array.from(nodeMap.values());
  let totalDegree = 0;
  for (const node of allNodes) {
    node.degree = node.parents.length + node.children.length + node.peers.length;
    totalDegree += Math.max(1, node.degree);
  }

  // Fallback PageRank/Tier assignment when loading untiered datasets (e.g. hand-written JSON)
  if (!hasExplicitTiers && allNodes.length > 0) {
    const sorted = [...allNodes].sort(
      (a, b) =>
        b.pagerank - a.pagerank || b.degree - a.degree || a.label.localeCompare(b.label)
    );
    const total = sorted.length;
    sorted.forEach((node, idx) => {
      const percentile = 1.0 - idx / total;
      if (percentile >= 0.98) node.tier = 1;
      else if (percentile >= 0.85) node.tier = 2;
      else if (percentile >= 0.5) node.tier = 3;
      else node.tier = 4;
      if (!node.pagerank || !Number.isFinite(node.pagerank)) {
        node.pagerank = Math.max(1, node.degree) / Math.max(1, totalDegree);
      }
    });
  }

  return {
    nodeMap,
    nodes: allNodes,
    directedEdges,
    peerEdges,
  };
}
