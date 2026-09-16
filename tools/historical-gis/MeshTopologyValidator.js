const EPSILON = 1e-9;

/** Validate an already-generated indexed triangle mesh without changing it. */
export function validateIndexedMeshTopology({ vertices, indices, expectedArea, epsilon = 1e-7 }) {
  const errors = [];
  if (!Array.isArray(vertices) || !ArrayBuffer.isView(indices)) return { valid: false, errors: ["Invalid mesh containers"] };
  if (indices.length % 3 !== 0) errors.push("Index count is not divisible by 3");

  const triangles = [];
  for (let i = 0; i + 2 < indices.length; i += 3) {
    const ids = [indices[i], indices[i + 1], indices[i + 2]];
    if (ids.some((id) => id >= vertices.length)) { errors.push(`Triangle ${i / 3} references an out-of-range vertex`); continue; }
    const [a, b, c] = ids.map((id) => vertices[id]);
    const area = Math.abs(cross(a, b, c)) * 0.5;
    if (area <= epsilon) errors.push(`Triangle ${i / 3} is degenerate`);
    triangles.push({ ids, a, b, c, area });
  }

  for (let i = 0; i < triangles.length; i += 1) {
    for (let j = i + 1; j < triangles.length; j += 1) {
      if (sharesVertex(triangles[i], triangles[j])) continue;
      if (triangleEdgesIntersect(triangles[i], triangles[j])) errors.push(`Triangle interiors/edges intersect: ${i},${j}`);
    }
  }

  const actualArea = triangles.reduce((sum, triangle) => sum + triangle.area, 0);
  if (Number.isFinite(expectedArea) && Math.abs(actualArea - expectedArea) > epsilon) errors.push(`Area mismatch: expected ${expectedArea}, got ${actualArea}`);
  return Object.freeze({ valid: errors.length === 0, errors, triangleCount: triangles.length, area: actualArea });
}

function sharesVertex(a, b) { return a.ids.some((id) => b.ids.includes(id)); }
function triangleEdgesIntersect(a, b) {
  const ea = [[a.a,a.b],[a.b,a.c],[a.c,a.a]], eb = [[b.a,b.b],[b.b,b.c],[b.c,b.a]];
  return ea.some(([p,q]) => eb.some(([r,s]) => properOrTouchingIntersection(p,q,r,s)));
}
function properOrTouchingIntersection(a,b,c,d) {
  const o1=cross(a,b,c), o2=cross(a,b,d), o3=cross(c,d,a), o4=cross(c,d,b);
  if (((o1 > EPSILON && o2 < -EPSILON) || (o1 < -EPSILON && o2 > EPSILON)) && ((o3 > EPSILON && o4 < -EPSILON) || (o3 < -EPSILON && o4 > EPSILON))) return true;
  return onSegment(a,b,c) || onSegment(a,b,d) || onSegment(c,d,a) || onSegment(c,d,b);
}
function onSegment(a,b,p) { return Math.abs(cross(a,b,p)) <= EPSILON && p[0] >= Math.min(a[0],b[0])-EPSILON && p[0] <= Math.max(a[0],b[0])+EPSILON && p[1] >= Math.min(a[1],b[1])-EPSILON && p[1] <= Math.max(a[1],b[1])+EPSILON; }
function cross(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
