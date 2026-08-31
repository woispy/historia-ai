const EDGES = Object.freeze(["north", "east", "south", "west"]);
function assertLod(lod, name) { if (!Number.isInteger(lod) || lod < 0) throw new Error(`${name} must be a non-negative integer.`); }

export function createTerrainDrawPlan({ tile, lod, adjacency, resident = true } = {}) {
  if (!tile?.id) throw new Error("Terrain draw plan requires a tile.");
  assertLod(lod, "Tile LOD");
  if (!adjacency || typeof adjacency !== "object") throw new Error("Terrain draw plan requires adjacency.");
  const edges = {};
  let topologyVariant = "base";
  for (const edge of EDGES) {
    const neighbor = adjacency[edge];
    if (!neighbor) { edges[edge] = Object.freeze({ mode: "boundary", neighborResident: false }); continue; }
    assertLod(neighbor.lod, `${edge} neighbor LOD`);
    if (Math.abs(neighbor.lod - lod) > 1) throw new Error(`Terrain LOD discontinuity exceeds one level on ${edge}.`);
    const mode = neighbor.lod === lod ? "same" : neighbor.lod > lod ? "neighbor-finer" : "neighbor-coarser";
    edges[edge] = Object.freeze({ mode, neighborResident: neighbor.resident !== false, topology: mode === "same" || mode === "boundary" ? "base" : "edge-stitch-2to1" });
    if (mode !== "same" && mode !== "boundary") topologyVariant = topologyVariant === "base" ? "edge-stitch-2to1" : "multi-edge-stitch-2to1";
  }
  return Object.freeze({ tileId: tile.id, lod, resident, edges: Object.freeze(edges), topologyVariant, draw: resident, deferUntilResident: !resident });
}
