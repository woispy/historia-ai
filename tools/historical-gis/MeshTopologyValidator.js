const EPSILON = 1e-9;

/** Validate an already-generated indexed triangle mesh without changing it. */
export function validateIndexedMeshTopology({ vertices, indices, expectedArea, epsilon = 1e-7 }) {
  const errors = [];
  if (!Array.isArray(vertices) || !ArrayBuffer.isView(indices)) return { valid: false, errors: ["Invalid mesh containers"] };
  if (indices.length % 3 !== 0) errors.push("Index count is not divisible by 3");

  const triangles = [];
  for (let i = 0; i + 2 < indices.length; i += 3) {
    const ids = [indices[i], indices[i + 1], indices[i + 2]];
    if (ids.some((id) => !Number.isInteger(id) || id < 0 || id >= vertices.length)) { errors.push(`Triangle ${i / 3} references an out-of-range vertex`); continue; }
    const [a, b, c] = ids.map((id) => vertices[id]);
    const area = Math.abs(cross(a, b, c)) * 0.5;
    if (area <= epsilon) errors.push(`Triangle ${i / 3} is degenerate`);
    triangles.push({ ids, a, b, c, area });
  }

  for (let i = 0; i < triangles.length; i += 1) {
    for (let j = i + 1; j < triangles.length; j += 1) {
      const relation = classifyTriangleContact(triangles[i], triangles[j]);
      if (relation === "shared-edge" || relation === "shared-vertex") continue;
      errors.push(`Triangle topology violation: ${i},${j} (${relation})`);
    }
  }

  const actualArea = triangles.reduce((sum, triangle) => sum + triangle.area, 0);
  if (Number.isFinite(expectedArea) && Math.abs(actualArea - expectedArea) > epsilon) errors.push(`Area mismatch: expected ${expectedArea}, got ${actualArea}`);
  return Object.freeze({ valid: errors.length === 0, errors, triangleCount: triangles.length, area: actualArea });
}

function classifyTriangleContact(a, b) {
  const sharedIds = a.ids.filter((id) => b.ids.includes(id));
  if (sharedIds.length === 2) return "shared-edge";

  const ea = [[a.a,a.b],[a.b,a.c],[a.c,a.a]], eb = [[b.a,b.b],[b.b,b.c],[b.c,b.a]];
  if (ea.some(([p,q]) => eb.some(([r,s]) => properIntersection(p,q,r,s)))) return "crossing";
  if (ea.some(([p,q]) => eb.some(([r,s]) => collinearPositiveOverlap(p,q,r,s)))) return "partial-edge-overlap";
  if (ea.some(([p,q]) => eb.some(([r,s]) => touchesAwayFromSharedVertex(p,q,r,s,sharedIds)))) return "t-junction-or-touch";
  if (pointStrictlyInTriangle(a.a,b.a,b.b,b.c) || pointStrictlyInTriangle(b.a,a.a,a.b,a.c)) return "overlap";
  if (sharedIds.length === 1) return "shared-vertex";
  return "disjoint";
}

function properIntersection(a,b,c,d) { const o1=cross(a,b,c),o2=cross(a,b,d),o3=cross(c,d,a),o4=cross(c,d,b); return opposite(o1,o2)&&opposite(o3,o4); }
function touchesAwayFromSharedVertex(a,b,c,d,sharedIds) { if (sharedIds.length) { const shared = sharedIds.some((id) => { const p = id === undefined ? null : null; return p; }); } return endpointOnInterior(a,b,c)||endpointOnInterior(a,b,d)||endpointOnInterior(c,d,a)||endpointOnInterior(c,d,b); }
function endpointOnInterior(a,b,p) { return Math.abs(cross(a,b,p))<=EPSILON && p[0]>=Math.min(a[0],b[0])-EPSILON && p[0]<=Math.max(a[0],b[0])+EPSILON && p[1]>=Math.min(a[1],b[1])-EPSILON && p[1]<=Math.max(a[1],b[1])+EPSILON && !samePoint(p,a) && !samePoint(p,b); }
function collinearPositiveOverlap(a,b,c,d) { if(Math.abs(cross(a,b,c))>EPSILON||Math.abs(cross(a,b,d))>EPSILON)return false; const axis=Math.abs(b[0]-a[0])>=Math.abs(b[1]-a[1])?0:1; return Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis]))-Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis]))>EPSILON; }
function pointStrictlyInTriangle(p,a,b,c) { const x=cross(a,b,p),y=cross(b,c,p),z=cross(c,a,p); return (x>EPSILON&&y>EPSILON&&z>EPSILON)||(x<-EPSILON&&y<-EPSILON&&z<-EPSILON); }
function samePoint(a,b) { return Math.abs(a[0]-b[0])<=EPSILON&&Math.abs(a[1]-b[1])<=EPSILON; }
function opposite(a,b) { return (a>EPSILON&&b<-EPSILON)||(a<-EPSILON&&b>EPSILON); }
function cross(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
