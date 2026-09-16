import { classifyTriangleContact } from "./TriangleContactKernel.js";

const EPSILON = 1e-8;

/** Validate that an indexed triangle mesh covers the intended polygon area without overlap. */
export function validateMeshCoverage({ vertices, indices, expectedArea, epsilon = EPSILON }) {
  const errors = [];
  const triangles = [];
  for (let i = 0; i + 2 < indices.length; i += 3) {
    const ids = [indices[i], indices[i + 1], indices[i + 2]];
    if (ids.some((id) => !Number.isInteger(id) || id < 0 || id >= vertices.length)) {
      errors.push(`Triangle ${i / 3} has invalid vertex index`);
      continue;
    }
    const points = ids.map((id) => vertices[id]);
    const area = Math.abs(cross(points[0], points[1], points[2])) * 0.5;
    if (area <= epsilon) errors.push(`Triangle ${i / 3} has zero/near-zero area`);
    triangles.push({ ids, points, area });
  }

  const area = triangles.reduce((sum, triangle) => sum + triangle.area, 0);
  if (Number.isFinite(expectedArea) && Math.abs(area - expectedArea) > epsilon) errors.push(`Coverage area mismatch: expected ${expectedArea}, got ${area}`);

  for (let i = 0; i < triangles.length; i += 1) {
    for (let j = i + 1; j < triangles.length; j += 1) {
      const relation = classifyTriangleContact(triangles[i], triangles[j], epsilon);
      if (relation === "shared-edge" || relation === "shared-vertex" || relation === "disjoint") continue;
      errors.push(`Triangle overlap/topology violation detected: ${i},${j} (${relation})`);
    }
  }

  return Object.freeze({ valid: errors.length === 0, errors, triangleCount: triangles.length, coveredArea: area });
}

function cross(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
