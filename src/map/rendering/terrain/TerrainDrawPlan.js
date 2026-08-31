const EDGES = Object.freeze(["north", "east", "south", "west"]);
function assertLod(lod, name) { if (!Number.isInteger(lod) || lod < 0) throw new Error(`${name} must be a non-negative integer.`); }

export function createTerrainDrawPlan({ tile, lod, adjacency, resident = true, topologyResolver = null } = {}) {
  if (!tile?.id) throw new Error("Terrain draw plan requires a tile.");
  assertLod(lod, "Tile LOD");
  if (!adjacency || typeof adjacency !== "object") throw new Error("Terrain draw plan requires adjacency.");
  if (topologyResolver !== null && typeof topologyResolver !== "function") throw new Error("Terrain topologyResolver must be a function.");
  const edges = {};
  let topologyVariant = "base";
  for (const edge of EDGES) {
    const neighbor = adjacency[edge];
    if (!neighbor) { edges[edge] = Object.freeze({ mode: "boundary", neighborResident: false }); continue; }
    assertLod(neighbor.lod, `${edge} neighbor LOD`);
    if (Math.abs(neighbor.lod - lod) > 1) throw new Error(`Terrain LOD discontinuity exceeds one level on ${edge}.`);
    const mode = neighbor.lod === lod ? "same" : neighbor.lod > lod ? "neighbor-finer" : "neighbor-coarser";
    const topology = topologyResolver ? topologyResolver({ tileId: tile.id, lod, edge, mode, neighborId: neighbor.id ?? null, neighborLod: neighbor.lod }) : mode === "same" || mode === "boundary" ? "base" : "edge-stitch-2to1";
    edges[edge] = Object.freeze({ mode, neighborResident: neighbor.resident !== false, topology });
    if (mode !== "same" && mode !== "boundary") topologyVariant = topologyVariant === "base" ? topology : topologyVariant === topology ? topologyVariant : "multi-edge";
  }
  return Object.freeze({ tileId: tile.id, lod, resident, edges: Object.freeze(edges), topologyVariant, draw: resident, deferUntilResident: !resident });
}
