const EPSILON = 1e-9;

/** Validate a candidate hole bridge before it is spliced into a polygon ring. */
export function validateHoleBridge({ outerRing, holeRing, outerIndex, holeIndex }) {
  const outer = outerRing ?? [];
  const hole = holeRing ?? [];
  if (outer.length < 3 || hole.length < 3) return { valid: false, reason: "ring-too-small" };
  if (outerIndex < 0 || outerIndex >= outer.length || holeIndex < 0 || holeIndex >= hole.length) return { valid: false, reason: "index-out-of-range" };

  const a = outer[outerIndex];
  const b = hole[holeIndex];
  if (!finitePoint(a) || !finitePoint(b) || samePoint(a, b)) return { valid: false, reason: "invalid-bridge-endpoints" };

  const rings = [outer, hole];
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i += 1) {
      const c = ring[i]; const d = ring[(i + 1) % ring.length];
      if (samePoint(c, a) || samePoint(d, a) || samePoint(c, b) || samePoint(d, b)) continue;
      if (properIntersection(a, b, c, d)) return { valid: false, reason: "bridge-crosses-ring-edge" };
    }
  }

  const midpoint = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5];
  if (!pointInRing(midpoint, outer) || pointInRing(midpoint, hole)) return { valid: false, reason: "bridge-midpoint-outside-free-space" };
  return Object.freeze({ valid: true, reason: "visible-bridge" });
}

function finitePoint(p) { return Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]); }
function samePoint(a,b) { return Math.abs(a[0]-b[0])<=EPSILON && Math.abs(a[1]-b[1])<=EPSILON; }
function properIntersection(a,b,c,d) { const o1=cross(a,b,c),o2=cross(a,b,d),o3=cross(c,d,a),o4=cross(c,d,b); return ((o1>EPSILON&&o2<-EPSILON)||(o1<-EPSILON&&o2>EPSILON))&&((o3>EPSILON&&o4<-EPSILON)||(o3<-EPSILON&&o4>EPSILON)); }
function cross(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
function pointInRing(point, ring) { let inside=false; for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j]; const crosses=(a[1]>point[1])!==(b[1]>point[1]); if(crosses && point[0] < ((b[0]-a[0])*(point[1]-a[1]))/(b[1]-a[1])+a[0]) inside=!inside;} return inside; }
