import assert from "node:assert/strict";
import { isPhysicalLandPoint, resolvePhysicalGeometryBoundaryPoint, nearestBoundaryLandPoint } from "../historical-gis/recovery/physical-land-authority.mjs";

const EDGE = { provinceId: "pontus-amasya", edgeIndex: 3, start: [34.828390856782086, 41.01264370368176], end: [35.31959064327484, 41.25286549707603] };
const NICOMEDIA_FAILURE_EDGES = [
  { provinceId: "bithynia-nicomedia", edgeIndex: 0, start: [29.87953,40.72476], end: [29.88817,40.72993] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [29.88817,40.72993], end: [29.91915,40.71851] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 0, start: [29.94879,40.71649], end: [29.96697,40.7418] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 2, start: [29.87953,40.72476], end: [29.85423,40.7623] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 1, start: [29.96697,40.7418], end: [29.94879,40.71649] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [29.99643,40.72103], end: [30.01852,40.70688] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [30.01852,40.70688], end: [29.99643,40.72103] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 1, start: [30.02342,40.70087], end: [30.06008,40.71516] },
  { provinceId: "bithynia-nicaea", edgeIndex: 0, start: [29.91915,40.71851], end: [29.88817,40.72993] },
];
const v15Raw = {
  "bithynia-nicomedia": [[30.5,40.8],[30.45,40.73],[30.25,40.7],[30.05,40.72],[29.85,40.74],[29.65,40.75],[29.58442622950775,40.75327868852461],[29.341635687732115,40.896096654274984],[29.35,40.9],[29.55,40.96],[29.8,40.98],[30.05,40.98],[30.25,40.95],[30.42,40.88]],
  "bithynia-nicaea": [[30.047621167161058,40.48081107814065],[29.720844930416707,39.9789761431404],[29.62291606783551,39.87149324518543],[29.555744855967177,39.85420164609061],[29.18703703703718,40.868148148148094],[29.42,40.78],[29.579731543624376,40.756040268456346]],
};
function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}
function segDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy;const t=d?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/d)):0;return dist(p,[a[0]+dx*t,a[1]+dy*t]);}
function nearestEdge(edge,polygon){let best=null;for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];const score=Math.min(segDistance(edge.start,a,b),segDistance(edge.end,a,b));if(!best||score<best.score)best={edgeIndex:i,score,start:a,end:b};}return best;}
const aStart=resolvePhysicalGeometryBoundaryPoint(EDGE.start),aEnd=resolvePhysicalGeometryBoundaryPoint(EDGE.end);
const aProbe={...EDGE,startLand:isPhysicalLandPoint(EDGE.start),endLand:isPhysicalLandPoint(EDGE.end),resolvedStart:aStart,resolvedEnd:aEnd,startRecoveryDistance:aStart?dist(EDGE.start,aStart):null,endRecoveryDistance:aEnd?dist(EDGE.end,aEnd):null,nearestStart:nearestBoundaryLandPoint(EDGE.start),nearestEnd:nearestBoundaryLandPoint(EDGE.end)};
const edgeMatches=NICOMEDIA_FAILURE_EDGES.map(e=>({...e,v15RawNearestEdge:nearestEdge(e,v15Raw[e.provinceId])}));
assert.ok(aProbe.startLand===false||aProbe.resolvedStart||aProbe.startLand);
console.log(JSON.stringify({amasyaEdge3:aProbe,nicomediaEdgeMatches:edgeMatches},null,2));
