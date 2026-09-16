const EPSILON = 1e-10;

export function validateMultiRingTopology({ outerRing, holes = [], islands = [] }) {
  const outer = normalize(outerRing);
  const normalizedHoles = holes.map(normalize).filter((ring) => ring.length >= 3);
  const normalizedIslands = islands.map(normalize).filter((ring) => ring.length >= 3);

  if (outer.length < 3) return fail("outer-ring-too-small");
  if (selfIntersects(outer)) return fail("outer-ring-self-intersection");

  for (const [index, ring] of normalizedHoles.entries()) {
    if (selfIntersects(ring)) return fail(`hole-${index}-self-intersection`);
    if (!containsRing(outer, ring)) return fail(`hole-${index}-outside-outer-ring`);
    if (ringsIntersect(outer, ring)) return fail(`hole-${index}-touches-or-crosses-outer-ring`);
  }

  for (const [index, ring] of normalizedIslands.entries()) {
    if (selfIntersects(ring)) return fail(`island-${index}-self-intersection`);
    if (!containsRing(outer, ring)) return fail(`island-${index}-outside-outer-ring`);
    if (ringsIntersect(outer, ring)) return fail(`island-${index}-touches-or-crosses-outer-ring`);
  }

  for (let i = 0; i < normalizedHoles.length; i += 1) {
    for (let j = i + 1; j < normalizedHoles.length; j += 1) {
      if (ringsIntersect(normalizedHoles[i], normalizedHoles[j]) || containsRing(normalizedHoles[i], normalizedHoles[j]) || containsRing(normalizedHoles[j], normalizedHoles[i])) return fail(`holes-${i}-${j}-overlap`);
    }
  }

  for (let i = 0; i < normalizedIslands.length; i += 1) {
    for (let j = i + 1; j < normalizedIslands.length; j += 1) {
      if (ringsIntersect(normalizedIslands[i], normalizedIslands[j]) || containsRing(normalizedIslands[i], normalizedIslands[j]) || containsRing(normalizedIslands[j], normalizedIslands[i])) return fail(`islands-${i}-${j}-overlap`);
    }
  }

  return { status: "valid", outerRing: outer, holes: normalizedHoles, islands: normalizedIslands };
}

function fail(reason) { return { status: "invalid", reason }; }
function normalize(ring) {
  const result = [];
  for (const point of ring ?? []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    const previous = result.at(-1);
    if (!previous || !same(previous, p)) result.push(p);
  }
  if (result.length > 1 && same(result[0], result.at(-1))) result.pop();
  return result;
}
function same(a,b){return Math.abs(a[0]-b[0])<=EPSILON&&Math.abs(a[1]-b[1])<=EPSILON;}
function cross(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
function onSegment(a,b,p){return Math.abs(cross(a,b,p))<=EPSILON&&p[0]>=Math.min(a[0],b[0])-EPSILON&&p[0]<=Math.max(a[0],b[0])+EPSILON&&p[1]>=Math.min(a[1],b[1])-EPSILON&&p[1]<=Math.max(a[1],b[1])+EPSILON;}
function segmentsIntersect(a,b,c,d){const ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);if(((ab1>EPSILON&&ab2<-EPSILON)||(ab1<-EPSILON&&ab2>EPSILON))&&((cd1>EPSILON&&cd2<-EPSILON)||(cd1<-EPSILON&&cd2>EPSILON)))return true;return onSegment(a,b,c)||onSegment(a,b,d)||onSegment(c,d,a)||onSegment(c,d,b);}
function selfIntersects(ring){for(let i=0;i<ring.length;i+=1){const a=ring[i],b=ring[(i+1)%ring.length];for(let j=i+1;j<ring.length;j+=1){if(j===i||j===(i+1)%ring.length||(j+1)%ring.length===i)continue;if(segmentsIntersect(a,b,ring[j],ring[(j+1)%ring.length]))return true;}}return false;}
function ringsIntersect(a,b){for(let i=0;i<a.length;i+=1){for(let j=0;j<b.length;j+=1){if(segmentsIntersect(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;}}return false;}
function containsPoint(point,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if(onSegment(a,b,point))return true;const crosses=(a[1]>point[1])!==(b[1]>point[1]);if(crosses&&point[0]<((b[0]-a[0])*(point[1]-a[1]))/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function containsRing(container,ring){return ring.length>0&&containsPoint(ring[0],container);}
