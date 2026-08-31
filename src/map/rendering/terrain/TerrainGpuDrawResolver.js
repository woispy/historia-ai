import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
import { validateTerrainIndexTopology } from "./TerrainTopologyValidator.js";

export function resolveTerrainGpuDraw({ size, drawPlan, positions = null } = {}) {
  if (!drawPlan || typeof drawPlan !== "object") throw new Error("Terrain GPU draw resolution requires a draw plan.");
  if (!drawPlan.draw) return Object.freeze({ drawable: false, reason: drawPlan.deferUntilResident ? "not-resident" : "draw-disabled" });
  const edges = Object.fromEntries(["north","east","south","west"].map(edge => [edge, drawPlan.edges?.[edge]?.mode ?? "same"]));
  const topology = createTerrainEdgeIndexTopology({ size, edges });
  validateTerrainIndexTopology({ indices: topology.indices, vertexCount: topology.vertexCount, positions });
  return Object.freeze({ drawable: true, tileId: drawPlan.tileId, topologyVariant: topology.transitionEdges.length ? "stitched" : "base", indexCount: topology.indexCount, indices: topology.indices, edges: topology.edges });
}
