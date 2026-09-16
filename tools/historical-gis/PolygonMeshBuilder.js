import { triangulateSimpleRing } from "./DeterministicPolygonTriangulator.js";

/** Build a renderer-only indexed mesh without mutating source geometry. */
export function buildSimplePolygonMesh({ provinceId, geometryId, outerRing, holes = [], islands = [] }) {
  if (holes.length || islands.length) {
    throw new Error("PolygonMeshBuilder currently requires a simple single-ring polygon");
  }

  const source = outerRing.map(([x, y]) => [Number(x), Number(y)]);
  const indices = triangulateSimpleRing(source);
  if (!indices.length) throw new Error(`Unable to triangulate polygon ${provinceId}`);

  const vertices = new Float32Array(source.length * 2);
  source.forEach(([x, y], index) => {
    vertices[index * 2] = x;
    vertices[index * 2 + 1] = y;
  });

  return Object.freeze({
    provinceId,
    geometryId,
    vertexCount: source.length,
    indexCount: indices.length,
    vertices,
    indices: Uint32Array.from(indices),
  });
}
