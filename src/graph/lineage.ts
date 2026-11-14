import type { LineageSets, NormalizedNode } from './types';

/**
 * "All" ancestry/descendants depth. The depth slider's last stop maps to this,
 * so an unlimited lineage stays the fallback for callers that omit `maxDepth`.
 */
export const LINEAGE_DEPTH_ALL = Number.POSITIVE_INFINITY;

/** Highest numeric stop on the depth slider; `+ 1` is the "All" stop. */
export const LINEAGE_DEPTH_MAX_OPTION = 4;

/** Slider stop (1..5, where 5 means "All") -> `computeLineage` depth argument. */
export function optionToLineageDepth(option: number): number {
  if (!Number.isFinite(option) || option > LINEAGE_DEPTH_MAX_OPTION) {
    return LINEAGE_DEPTH_ALL;
  }
  return Math.max(1, Math.round(option));
}

/** `computeLineage` depth argument -> slider stop (1..5). */
export function lineageDepthToOption(depth: number): number {
  if (!Number.isFinite(depth)) return LINEAGE_DEPTH_MAX_OPTION + 1;
  return Math.min(
    LINEAGE_DEPTH_MAX_OPTION,
    Math.max(1, Math.round(depth))
  );
}

/**
 * Computes the upstream ancestry, downstream descendants and lateral peers for
 * the selected node, limited to `maxDepth` hops away. Used for lineage
 * spotlighting by BOTH the renderer and the hit-tester.
 *
 * `maxDepth = 1` (the default) highlights only the direct roots and direct
 * successors of the selection; `LINEAGE_DEPTH_ALL` walks the whole component.
 * Peers are always direct-only: they are a one-hop relation by definition.
 */
export function computeLineage(
  nodeMap: Map<string, NormalizedNode>,
  selectedId: string | null,
  maxDepth: number = LINEAGE_DEPTH_ALL
): LineageSets {
  const ancestorNodes = new Set<string>();
  const descendantNodes = new Set<string>();
  const peerNodes = new Set<string>();
  const ancestorEdges = new Set<string>();
  const descendantEdges = new Set<string>();
  const peerEdgesSet = new Set<string>();

  if (!selectedId || !nodeMap.has(selectedId)) {
    return {
      ancestorNodes,
      descendantNodes,
      peerNodes,
      ancestorEdges,
      descendantEdges,
      peerEdgesSet,
      allFamilyNodes: new Set<string>(),
    };
  }

  // Normalize the depth guard once so `NaN`/`0`/fractions cannot leak in.
  const depthLimit =
    Number.isFinite(maxDepth) && maxDepth >= 1
      ? Math.floor(maxDepth)
      : LINEAGE_DEPTH_ALL;

  const upQueue: Array<{ id: string; depth: number }> = [
    { id: selectedId, depth: 0 },
  ];
  const upVisited = new Set<string>([selectedId]);
  for (let q = 0; q < upQueue.length; q++) {
    const curr = upQueue[q];
    const currNode = nodeMap.get(curr.id);
    if (!currNode) continue;

    // Stop before touching edges at the limit: an edge to an unhighlighted
    // node must never be drawn.
    const nextDepth = curr.depth + 1;
    if (nextDepth > depthLimit) continue;

    for (const pId of currNode.parents) {
      ancestorEdges.add(`${pId}->${curr.id}`);
      if (!upVisited.has(pId)) {
        upVisited.add(pId);
        ancestorNodes.add(pId);
        upQueue.push({ id: pId, depth: nextDepth });
      }
    }
  }

  const downQueue: Array<{ id: string; depth: number }> = [
    { id: selectedId, depth: 0 },
  ];
  const downVisited = new Set<string>([selectedId]);
  for (let q = 0; q < downQueue.length; q++) {
    const curr = downQueue[q];
    const currNode = nodeMap.get(curr.id);
    if (!currNode) continue;

    const nextDepth = curr.depth + 1;
    if (nextDepth > depthLimit) continue;

    for (const cId of currNode.children) {
      descendantEdges.add(`${curr.id}->${cId}`);
      if (!downVisited.has(cId)) {
        downVisited.add(cId);
        descendantNodes.add(cId);
        downQueue.push({ id: cId, depth: nextDepth });
      }
    }
  }

  const selNode = nodeMap.get(selectedId);
  if (selNode) {
    for (const peerId of selNode.peers) {
      peerNodes.add(peerId);
      const pairKey =
        selectedId < peerId ? `${selectedId}<->${peerId}` : `${peerId}<->${selectedId}`;
      peerEdgesSet.add(pairKey);
    }
  }

  const allFamilyNodes = new Set<string>([
    selectedId,
    ...ancestorNodes,
    ...descendantNodes,
    ...peerNodes,
  ]);

  return {
    ancestorNodes,
    descendantNodes,
    peerNodes,
    ancestorEdges,
    descendantEdges,
    peerEdgesSet,
    allFamilyNodes,
  };
}
