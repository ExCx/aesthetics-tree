import type { LineageSets, NormalizedNode } from './types';

/**
 * Computes the full upstream ancestry, downstream descendants and lateral
 * peers for the selected node. Used for lineage spotlighting by BOTH the
 * renderer and the hit-tester.
 */
export function computeLineage(
  nodeMap: Map<string, NormalizedNode>,
  selectedId: string | null
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

  const upQueue: string[] = [selectedId];
  const upVisited = new Set<string>([selectedId]);
  while (upQueue.length > 0) {
    const currId = upQueue.shift();
    if (!currId) continue;
    const currNode = nodeMap.get(currId);
    if (!currNode) continue;
    for (const pId of currNode.parents) {
      ancestorEdges.add(`${pId}->${currId}`);
      if (!upVisited.has(pId)) {
        upVisited.add(pId);
        ancestorNodes.add(pId);
        upQueue.push(pId);
      }
    }
  }

  const downQueue: string[] = [selectedId];
  const downVisited = new Set<string>([selectedId]);
  while (downQueue.length > 0) {
    const currId = downQueue.shift();
    if (!currId) continue;
    const currNode = nodeMap.get(currId);
    if (!currNode) continue;
    for (const cId of currNode.children) {
      descendantEdges.add(`${currId}->${cId}`);
      if (!downVisited.has(cId)) {
        downVisited.add(cId);
        descendantNodes.add(cId);
        downQueue.push(cId);
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
