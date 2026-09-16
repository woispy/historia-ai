import { aggregateTerrainEvidence } from "./TerrainEvidenceAdapter.js";

/** Scores an existing P6.1 candidate edge with sampled physical evidence. Never promotes an edge to authoritative topology. */
export function scoreAdjacencyEdge(edge, samples = []) {
  if (!edge?.source || !edge?.target) throw new TypeError("edge requires source and target");
  const evidence = samples.length ? aggregateTerrainEvidence(samples) : null;
  const physicalPenalty = evidence ? evidence.meanCost : 0;
  const physicalSupport = evidence ? Math.max(0, 1 - Math.min(1, physicalPenalty)) : null;
  return Object.freeze({
    edgeId: edge.id ?? `adj:${edge.source}:${edge.target}`,
    source: edge.source,
    target: edge.target,
    candidateOnly: true,
    physicalSupport,
    physicalPenalty,
    evidenceSampleCount: evidence?.sampleCount ?? 0,
    channelMeans: evidence?.averageChannels ?? null,
    disposition: physicalSupport == null ? "unscored" : physicalSupport >= 0.55 ? "retain-candidate" : "challenge-candidate",
  });
}

export function scoreAdjacencyEdges(edges, sampleProvider = () => []) {
  if (!Array.isArray(edges)) throw new TypeError("edges must be an array");
  return edges.map((edge) => scoreAdjacencyEdge(edge, sampleProvider(edge) ?? []));
}
