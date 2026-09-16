/**
 * 1326 candidate evidence pilot.
 *
 * Combines T3-D reference association, T3-E terrain evidence, and P6.1 edge
 * scoring into one deterministic review package. Candidate-only: it cannot
 * mutate or promote political geometry/topology.
 */
import { associateT3ReferencePointsWithP61 } from "./T3P61ReferenceAssociation.js";
import { associateT3ReferencePointsWithTerrain } from "./T3TerrainConstraintAdapter.js";
import { scoreAdjacencyEdges } from "./AdjacencyEvidenceScorer.js";
import { createDEMSamplerEvidenceProvider } from "./DEMSamplerEvidenceBridge.js";

function requireCandidate(result, label) {
  if (!result || result.authoritative !== false) throw new Error(`${label} must remain non-authoritative`);
  return result;
}

function buildNodeIndex(adjacencyGraph) {
  return new Map((adjacencyGraph.nodes ?? []).map((node) => [node.id, node]));
}

function buildAssociationIndex(edgeAssociations = []) {
  return new Map(edgeAssociations.map((association) => [association.edgeId, association]));
}

function nodeCoordinates(node) {
  const position = node?.position ?? node;
  if (!Number.isFinite(Number(position?.lon)) || !Number.isFinite(Number(position?.lat))) return null;
  return { lon: Number(position.lon), lat: Number(position.lat) };
}

export function build1326CandidateEvidencePilot({
  scenarioDate = "1326-04-07",
  region = "Bursa-Nicaea-Nicomedia-Sangarius",
  t3Result,
  adjacencyGraph,
  referenceTerrainProvider = () => [],
  edgeTerrainProvider = () => [],
  demSampler = null,
  demSamplerOptions = {},
  radiusKm = 35,
}) {
  if (scenarioDate !== "1326-04-07") throw new RangeError("1326 pilot requires scenarioDate 1326-04-07");
  requireCandidate(t3Result, "T3 result");
  requireCandidate(adjacencyGraph, "P6.1 graph");

  const nodeById = buildNodeIndex(adjacencyGraph);
  const demProvider = demSampler ? createDEMSamplerEvidenceProvider(demSampler, demSamplerOptions) : null;
  const resolvedReferenceTerrainProvider = demProvider
    ? (reference) => {
      const [lon, lat] = reference.point;
      const evidence = demProvider.sample({ lon, lat });
      return evidence.valid ? [evidence] : [];
    }
    : referenceTerrainProvider;

  const resolvedEdgeTerrainProvider = demProvider
    ? (edge) => {
      const source = nodeCoordinates(nodeById.get(edge.source));
      const target = nodeCoordinates(nodeById.get(edge.target));
      if (!source || !target) return [];
      const sourceEvidence = demProvider.sample(source);
      const targetEvidence = demProvider.sample(target);
      return [sourceEvidence, targetEvidence].filter((evidence) => evidence.valid);
    }
    : edgeTerrainProvider;

  const t3Association = associateT3ReferencePointsWithP61(t3Result, adjacencyGraph, { radiusKm });
  const terrainAssociation = associateT3ReferencePointsWithTerrain(t3Result, resolvedReferenceTerrainProvider);
  const edgeScores = scoreAdjacencyEdges(adjacencyGraph.edges, resolvedEdgeTerrainProvider);
  const associationByEdgeId = buildAssociationIndex(t3Association.edgeAssociations);

  const edgeEvidence = edgeScores.map((score) => {
    const association = associationByEdgeId.get(score.edgeId) ?? null;
    return Object.freeze({
      ...score,
      t3ReferencePointCount: association?.referencePointCount ?? 0,
      t3ReferencePointIds: association?.referencePointIds ?? [],
      strongestReferenceImportance: association?.strongestReferenceImportance ?? null,
      lockedReferenceCount: association?.lockedReferenceCount ?? 0,
      constraintReferenceCount: association?.constraintReferenceCount ?? 0,
      reviewFlags: [
        ...(association?.lockedReferenceCount ? ["locked-reference-near-edge"] : []),
        ...(association?.constraintReferenceCount ? ["constraint-reference-near-edge"] : []),
        ...(score.disposition === "challenge-candidate" ? ["physical-evidence-challenge"] : []),
        ...(score.disposition === "unscored" ? ["missing-physical-evidence"] : []),
      ].sort(),
    });
  });

  return Object.freeze({
    schemaVersion: 1,
    phase: "1326-CANDIDATE-EVIDENCE-PILOT",
    scenarioDate,
    region,
    authoritative: false,
    status: "candidate-review-package",
    terrainSource: demProvider ? "P6.2-CopernicusDemCostSampler" : "injected-candidate-provider",
    layers: {
      t3D: t3Association,
      t3E: terrainAssociation,
      p61EdgeEvidence: edgeEvidence,
    },
    diagnostics: {
      candidateEdgeCount: edgeEvidence.length,
      scoredEdgeCount: edgeEvidence.filter((edge) => edge.evidenceSampleCount > 0).length,
      challengedEdgeCount: edgeEvidence.filter((edge) => edge.disposition === "challenge-candidate").length,
      unscoredEdgeCount: edgeEvidence.filter((edge) => edge.disposition === "unscored").length,
      terrainSupportedReferenceCount: terrainAssociation.diagnostics.terrainSupportedCount,
      terrainConstrainedReferenceCount: terrainAssociation.diagnostics.terrainConstrainedCount,
      demSamplerConnected: Boolean(demProvider),
    },
  });
}
