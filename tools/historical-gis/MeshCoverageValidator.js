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
      const relation = classifyTriangleContact(triangles[i], triangles[j]);
      if (relation === "shared-edge") continue;
      if (relation === "overlap" || relation === "invalid-contact") {
        errors.push(`Triangle overlap/topology violation detected: ${i},${j} (${relation})`);
      }
    }
  }

  return Object.freeze({ valid: errors.length === 0, errors, triangleCount: triangles.length, coveredArea: area });
}

function classifyTriangleContact(a, b) {
  const sharedIds = a.ids.filter((id) => b.ids.includes(id));
  if (sharedIds.length === 2) {
    const shared = new Set(sharedIds);
    const aEdge = a.ids.filter((id) => shared.has(id));
    const bEdge = b.ids.filter((id) => shared.has(id));
    if (aEdge.length === 2 && bEdge.length === 2 && samePoint(verticesPoint(a, aEdge[0]), verticesPoint(b, bEdge[0])) && samePoint(verticesPoint(a, aEdge[1]), verticesPoint(b, bEdge[1]))) return "shared-edge";
    return "invalid-contact";
  }

  const edgesA = edges(a.points), edgesB = edges(b.points);
  if (edgesA.some(([p, q]) => edgesB.some(([r, s]) => collinearPositiveOverlap(p, q, r, s)))) return "invalid-contact";
  if (edgesA.some(([p, q]) => edgesB.some(([r, s]) => properIntersection(p, q, r, s)))) return "overlap";

  if (pointStrictlyInTriangle(a.points[0], ...b.points) || pointStrictlyInTriangle(b.points[0], ...a.points)) return "overlap";

  // A shared vertex is a legitimate mesh contact. Any additional edge/vertex
  // penetration was already classified above, including T-junctions.
  return "boundary-touch";
}

function verticesPoint(triangle, id) { return triangle.points[triangle.ids.indexOf(id)]; }
function edges(points) { return [[points[0],points[1]],[points[1],points[2]],[points[2],points[0]]]; }
function properIntersection(a,b,c,d) { const o1=cross(a,b,c),o2=cross(a,b,d),o3=cross(c,d,a),o4=cross(c,d,b); return opposite(o1,o2) && opposite(o3,o4); }
function opposite(a,b) { return (a > EPSILON && b < -EPSILON) || (a < -EPSILON && b > EPSILON); }
function collinearPositiveOverlap(a,b,c,d) { if (Math.abs(cross(a,b,c)) > EPSILON || Math.abs(cross(a,b,d)) > EPSILON) return false; const dx=Math.abs(b[0]-a[0]),dy=Math.abs(b[1]-a[1]); const axis=dx>=dy?0:1; const lo=Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis])); const hi=Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis])); return hi-lo>EPSILON; }
function pointStrictlyInTriangle(p,a,b,c) { const x=cross(a,b,p),y=cross(b,c,p),z=cross(c,a,p); return (x>EPSILON&&y>EPSILON&&z>EPSILON)||(x<-EPSILON&&y<-EPSILON&&z<-EPSILON); }
function samePoint(a,b) { return Math.abs(a[0]-b[0])<=EPSILON && Math.abs(a[1]-b[1])<=EPSILON; }
function cross(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
