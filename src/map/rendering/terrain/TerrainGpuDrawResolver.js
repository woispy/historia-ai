import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
import { validateTerrainIndexTopology } from "./TerrainTopologyValidator.js";
import { validateTerrainTopologyCoverage } from "./TerrainTopologyCoverageValidator.js";
import { validateTerrainTriangleCoverage } from "./TerrainTriangleCoverageValidator.js";
import { validateTerrainCellOccupancy } from "./TerrainTopologyOccupancyValidator.js";
import { validateTerrainExactCellCoverage } from "./TerrainTopologyExactCoverageValidator.js";

export function resolveTerrainGpuDraw({ size, drawPlan, positions = null } = {}) {
  if (!drawPlan || typeof drawPlan !== "object") throw new Error("Terrain GPU draw resolution requires a draw plan.");
  if (!drawPlan.draw) return Object.freeze({ drawable: false, reason: drawPlan.deferUntilResident ? "not-resident" : "draw-disabled" });
  const edges = Object.fromEntries(["north","east","south","west"].map(edge => [edge, drawPlan.edges?.[edge]?.mode ?? "same"]));
  const topology = createTerrainEdgeIndexTopology({ size, edges });
  validateTerrainIndexTopology({ indices: topology.indices, vertexCount: topology.vertexCount, positions });
  const coverage = validateTerrainTopologyCoverage({ indices: topology.indices, vertexCount: topology.vertexCount, size, edges });
  if (!coverage.completeGridEdgeCoverage) throw new Error(`Terrain topology coverage is incomplete: ${coverage.missingGridEdges} grid edge(s) missing.`);
  if (!(positions instanceof Float32Array) || positions.length !== size * size * 2) throw new Error("Terrain GPU draw resolution requires XY positions for geometric coverage validation.");
  const areaCoverage = validateTerrainTriangleCoverage({ indices: topology.indices, positions, size });
  if (!areaCoverage.completeAreaCoverage) throw new Error(`Terrain geometric coverage is incomplete: area difference ${areaCoverage.areaDifference}.`);
  const occupancy = validateTerrainCellOccupancy({ indices: topology.indices, positions, size });
  if (!occupancy.completeCellCoverage) throw new Error(`Terrain cell occupancy is incomplete: ${occupancy.uncoveredCells} uncovered, ${occupancy.overlapCells} overlapping.`);
  const exactCoverage = validateTerrainExactCellCoverage({ indices: topology.indices, positions, size });
  if (!exactCoverage.completeExactCoverage) throw new Error(`Terrain exact geometric coverage is incomplete: ${exactCoverage.uncoveredArea} uncovered area, ${exactCoverage.overlapArea} overlapping area.`);
  return Object.freeze({ drawable: true, tileId: drawPlan.tileId, topologyVariant: topology.transitionEdges.length ? "stitched" : "base", indexCount: topology.indexCount, indices: topology.indices, edges: topology.edges, coverage, areaCoverage, occupancy, exactCoverage });
}
