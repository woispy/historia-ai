const EPSILON = 1e-9;

/** Classify the geometric relationship between two indexed triangles. */
export function classifyTriangleContact(a, b, epsilon = EPSILON) {
  const sharedIds = a.ids.filter((id) => b.ids.includes(id));
  if (sharedIds.length === 3) return "duplicate-triangle";
  if (sharedIds.length === 2) return "shared-edge";

  const edgesA = edges(a.points ?? [a.a, a.b, a.c]);
  const edgesB = edges(b.points ?? [b.a, b.b, b.c]);

  if (edgesA.some(([p, q]) => edgesB.some(([r, s]) => properIntersection(p, q, r, s, epsilon)))) return "crossing";
  if (edgesA.some(([p, q]) => edgesB.some(([r, s]) => collinearPositiveOverlap(p, q, r, s, epsilon)))) return "partial-edge-overlap";
  if (edgesA.some(([p, q]) => edgesB.some(([r, s]) => endpointOnInterior(p, q, r, epsilon) || endpointOnInterior(p, q, s, epsilon)))) return "t-junction";

  const pointsA = a.points ?? [a.a, a.b, a.c];
  const pointsB = b.points ?? [b.a, b.b, b.c];
  if (pointStrictlyInTriangle(pointsA[0], ...pointsB, epsilon) || pointStrictlyInTriangle(pointsB[0], ...pointsA, epsilon)) return "overlap";
  if (sharedIds.length === 1) return "shared-vertex";
  return "disjoint";
}

function edges(points) { return [[points[0], points[1]], [points[1], points[2]], [points[2], points[0]]]; }
function properIntersection(a, b, c, d, e) { const o1 = cross(a,b,c), o2 = cross(a,b,d), o3 = cross(c,d,a), o4 = cross(c,d,b); return opposite(o1,o2,e) && opposite(o3,o4,e); }
function endpointOnInterior(a,b,p,e) { return Math.abs(cross(a,b,p)) <= e && p[0] >= Math.min(a[0],b[0])-e && p[0] <= Math.max(a[0],b[0])+e && p[1] >= Math.min(a[1],b[1])-e && p[1] <= Math.max(a[1],b[1])+e && !samePoint(p,a,e) && !samePoint(p,b,e); }
function collinearPositiveOverlap(a,b,c,d,e) { if (Math.abs(cross(a,b,c)) > e || Math.abs(cross(a,b,d)) > e) return false; const axis = Math.abs(b[0]-a[0]) >= Math.abs(b[1]-a[1]) ? 0 : 1; return Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis])) - Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis])) > e; }
function pointStrictlyInTriangle(p,a,b,c,e) { const x=cross(a,b,p), y=cross(b,c,p), z=cross(c,a,p); return (x>e&&y>e&&z>e)||(x<-e&&y<-e&&z<-e); }
function samePoint(a,b,e) { return Math.abs(a[0]-b[0]) <= e && Math.abs(a[1]-b[1]) <= e; }
function opposite(a,b,e) { return (a>e&&b<-e)||(a<-e&&b>e); }
function cross(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
