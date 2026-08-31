const EDGES = Object.freeze(["north", "east", "south", "west"]);
const OPPOSITE = Object.freeze({ north: "south", east: "west", south: "north", west: "east" });
function assertTile(tile) { if (!tile || !Number.isInteger(tile.x) || !Number.isInteger(tile.y) || !Number.isInteger(tile.zoom) || tile.zoom < 0) throw new Error("Invalid terrain tile key."); }
function neighbor(tile, edge) { const d = edge === "north" ? [0,-1] : edge === "east" ? [1,0] : edge === "south" ? [0,1] : [-1,0]; return { ...tile, x: tile.x + d[0], y: tile.y + d[1] }; }

export function buildTerrainAdjacency(tile, lookup) { assertTile(tile); if (!(lookup instanceof Map)) throw new Error("Terrain adjacency requires a tile lookup map."); const result = {}; for (const edge of EDGES) { const key = neighbor(tile, edge); const id = `${key.zoom}/${key.x}/${key.y}`; result[edge] = lookup.get(id) || null; } return Object.freeze(result); }

export function planTerrainLodSeams(tileLod, adjacency) { if (!Number.isInteger(tileLod) || tileLod < 0) throw new Error("Tile LOD must be non-negative."); if (!adjacency || typeof adjacency !== "object") throw new Error("Terrain adjacency is required."); const plan = {}; for (const edge of EDGES) { const neighborLod = adjacency[edge]?.lod ?? tileLod; if (!Number.isInteger(neighborLod) || neighborLod < 0) throw new Error(`Invalid neighbor LOD on ${edge}.`); const delta = neighborLod - tileLod; if (Math.abs(delta) > 1) throw new Error(`Terrain LOD discontinuity exceeds one level on ${edge}.`); plan[edge] = Object.freeze({ neighborLod, delta, transition: delta === 0 ? "same" : delta > 0 ? "neighbor-coarser" : "neighbor-finer" }); } return Object.freeze(plan); }

export { EDGES, OPPOSITE };
