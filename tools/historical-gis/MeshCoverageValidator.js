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
    const triangle = ids.map((id) => vertices[id]);
    const area = Math.abs(cross(triangle[0], triangle[1], triangle[2])) * 0.5;
    if (area <= epsilon) errors.push(`Triangle ${i / 3} has zero/near-zero area`);
    triangles.push({ ids, points: triangle, area });
  }

  const area = triangles.reduce((sum, triangle) => sum + triangle.area, 0);
  if (Number.isFinite(expectedArea) && Math.abs(area - expectedArea) > epsilon) {
    errors.push(`Coverage area mismatch: expected ${expectedArea}, got ${area}`);
  }

  for (let i = 0; i < triangles.length; i += 1) {
    for (let j = i + 1; j < triangles.length; j += 1) {
      if (shareOnlyBoundary(triangles[i], triangles[j])) continue;
      if (trianglesOverlap(triangles[i], triangles[j])) {
        errors.push(`Triangle overlap detected: ${i},${j}`);
      }
    }
  }

  return Object.freeze({ valid: errors.length === 0, errors, triangleCount: triangles.length, coveredArea: area });
}

function shareOnlyBoundary(a, b) {
  return a.ids.some((id) => b.ids.includes(id));
}

function trianglesOverlap(a, b) {
  const edgesA = edges(a.points), edgesB = edges(b.points);
  if (edgesA.some(([p, q]) => edgesB.some(([r, s]) => properIntersection(p, q, r, s)))) return true;
  return pointInTriangle(a.points[0], ...b.points) || pointInTriangle(b.points[0], ...a.points);
}

function properIntersection(a, b, c, d) {
  const o1 = cross(a,b,c), o2 = cross(a,b,d), o3 = cross(c,d,a), o4 = cross(c,d,b);
  return ((o1 > EPSILON && o2 < -EPSILON) || (o1 < -EPSILON && o2 > EPSILON)) && ((o3 > EPSILON && o4 < -EPSILON) || (o3 < -EPSILON && o4 > EPSILON));
}
function pointInTriangle(p,a,b,c) { const x=cross(a,b,p),y=cross(b,c,p),z=cross(c,a,p); return x >= -EPSILON && y >= -EPSILON && z >= -EPSILON; }
function edges(points) { return [[points[0],points[1]],[points[1],points[2]],[points[2],points[0]]]; }
function cross(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
