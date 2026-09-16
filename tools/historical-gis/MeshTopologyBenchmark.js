import { buildMeshTopologyReport } from "./MeshTopologyEngine.js";

/** Deterministic QA benchmark: measures broad-phase candidate reduction without changing validation semantics. */
export function benchmarkMeshTopology({ vertices, indices, cellSize = 1, epsilon = 1e-9 }) {
  const triangleCount = Math.floor(indices.length / 3);
  const totalPairs = triangleCount * Math.max(0, triangleCount - 1) / 2;
  const started = performanceNow();
  const report = buildMeshTopologyReport({ vertices, indices, cellSize, epsilon });
  const elapsedMs = performanceNow() - started;
  const candidatePairs = report.candidatePairs.length;
  const reductionRatio = totalPairs === 0 ? 0 : 1 - candidatePairs / totalPairs;
  return Object.freeze({
    triangleCount,
    totalPairs,
    candidatePairs,
    reductionRatio,
    elapsedMs,
    valid: report.valid,
  });
}

function performanceNow() { return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now(); }
