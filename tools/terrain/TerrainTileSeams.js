function assertTile(tile) {
  if (!tile || !Number.isInteger(tile.tileSize) || tile.tileSize < 2 || !Number.isInteger(tile.lod) || tile.lod < 0) throw new Error("Invalid terrain tile.");
}

export const TERRAIN_EDGE = Object.freeze({ NORTH: "north", EAST: "east", SOUTH: "south", WEST: "west" });

export function getEdgeSamples(tile, edge) {
  assertTile(tile);
  const n = tile.tileSize;
  const values = [];
  for (let i = 0; i < n; i += 1) {
    const index = edge === TERRAIN_EDGE.NORTH ? i : edge === TERRAIN_EDGE.SOUTH ? (n - 1) * n + i : edge === TERRAIN_EDGE.WEST ? i * n : i * n + (n - 1);
    values.push(tile.heights[index]);
  }
  return values;
}

export function classifyNeighborLod(tileLod, neighborLod) {
  if (!Number.isInteger(tileLod) || !Number.isInteger(neighborLod) || tileLod < 0 || neighborLod < 0) throw new Error("LOD values must be non-negative integers.");
  const delta = neighborLod - tileLod;
  if (Math.abs(delta) > 1) throw new Error("Terrain LOD adjacency cannot skip more than one level.");
  return delta === 0 ? "same" : delta > 0 ? "neighbor-coarser" : "neighbor-finer";
}

export function buildEdgeStitchPattern({ tile, edge, neighborLod } = {}) {
  assertTile(tile);
  if (!Object.values(TERRAIN_EDGE).includes(edge)) throw new Error("Unknown terrain edge.");
  const relation = classifyNeighborLod(tile.lod, neighborLod);
  const n = tile.tileSize;
  const indices = [];
  if (relation === "same") return Object.freeze({ relation, edge, indices: Object.freeze(indices) });
  for (let i = 0; i < n - 1; i += 2) {
    const a = i; const b = Math.min(i + 1, n - 1); const c = Math.min(i + 2, n - 1);
    indices.push(Object.freeze([a, b, c]));
  }
  return Object.freeze({ relation, edge, indices: Object.freeze(indices) });
}

export function validateTileNeighbors({ tile, neighbors = {} } = {}) {
  assertTile(tile);
  const result = {};
  for (const edge of Object.values(TERRAIN_EDGE)) {
    if (neighbors[edge] === undefined || neighbors[edge] === null) { result[edge] = "boundary"; continue; }
    assertTile(neighbors[edge]);
    result[edge] = classifyNeighborLod(tile.lod, neighbors[edge].lod);
  }
  return Object.freeze(result);
}
