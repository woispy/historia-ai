import { classifyTriangleContact } from "./TriangleContactKernel.js";

/** Validate an already-generated indexed triangle mesh without changing it. */
export function validateIndexedMeshTopology({ vertices, indices, expectedArea, epsilon = 1e-7 }) {
  const errors = [];
  if (!Array.isArray(vertices) || !ArrayBuffer.isView(indices)) return { valid: false, errors: ["Invalid mesh containers"] };
  if (indices.length % 3 !== 0) errors.push("Index count is not divisible by 3");

  const triangles = [];
  for (let i = 0; i + 2 < indices.length; i += 3) {
    const ids = [indices[i], indices[i + 1], indices[i + 2]];
    if (ids.some((id) => !Number.isInteger(id) || id < 0 || id >= vertices.length)) { errors.push(`Triangle ${i / 3} references an out-of-range vertex`); continue; }
    const points = ids.map((id) => vertices[id]);
    const area = Math.abs(cross(points[0], points[1], points[2])) * 0.5;
    if (area <= epsilon) errors.push(`Triangle ${i / 3} is degenerate`);
    triangles.push({ ids, points, area });
  }

  for (let i = 0; i < triangles.length; i += 1) {
    for (let j = i + 1; j < triangles.length; j += 1) {
      const relation = classifyTriangleContact(triangles[i], triangles[j], epsilon);
      if (relation !== "shared-edge" && relation !== "shared-vertex" && relation !== "disjoint") errors.push(`Triangle topology violation: ${i},${j} (${relation})`);
    }
  }

  const actualArea = triangles.reduce((sum, triangle) => sum + triangle.area, 0);
  if (Number.isFinite(expectedArea) && Math.abs(actualArea - expectedArea) > epsilon) errors.push(`Area mismatch: expected ${expectedArea}, got ${actualArea}`);
  return Object.freeze({ valid: errors.length === 0, errors, triangleCount: triangles.length, area: actualArea });
}

function cross(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
