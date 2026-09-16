import { buildTriangleSpatialIndex, candidateTrianglePairs } from "./TriangleSpatialIndex.js";
import { classifyTriangleContact } from "./TriangleContactKernel.js";

/** Shared extraction + broad-phase + exact-contact engine for mesh QA. */
export function buildMeshTopologyReport({ vertices, indices, cellSize = 1, epsilon = 1e-9 }) {
  const triangles = [];
  const errors = [];
  if (!Array.isArray(vertices) || !ArrayBuffer.isView(indices)) return Object.freeze({ valid: false, errors: ["Invalid mesh containers"], triangles: [], candidatePairs: [] });
  if (indices.length % 3 !== 0) errors.push("Index count is not divisible by 3");

  for (let i = 0; i + 2 < indices.length; i += 3) {
    const ids = [indices[i], indices[i + 1], indices[i + 2]];
    if (ids.some((id) => !Number.isInteger(id) || id < 0 || id >= vertices.length)) { errors.push(`Triangle ${i / 3} references an out-of-range vertex`); continue; }
    const points = ids.map((id) => vertices[id]);
    const area = Math.abs(cross(points[0], points[1], points[2])) * 0.5;
    if (area <= epsilon) errors.push(`Triangle ${i / 3} is degenerate`);
    triangles.push({ ids, points, area });
  }

  const index = buildTriangleSpatialIndex(triangles, { cellSize });
  const pairs = candidateTrianglePairs(triangles, index);
  const relations = [];
  for (const [a, b] of pairs) {
    const relation = classifyTriangleContact(triangles[a], triangles[b], epsilon);
    relations.push({ a, b, relation });
    if (!["shared-edge", "shared-vertex", "disjoint"].includes(relation)) errors.push(`Triangle topology violation: ${a},${b} (${relation})`);
  }
  return Object.freeze({ valid: errors.length === 0, errors, triangles, candidatePairs: pairs, relations });
}
function cross(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
