import assert from "node:assert/strict";
import { isPhysicalLandPoint, isLakeInteriorPoint, resolvePhysicalGeometryBoundaryPoint, nearestBoundaryLandPoint, nearestLakeBoundaryPoint } from "../historical-gis/recovery/physical-land-authority.mjs";

const EDGE = { provinceId: "pontus-amasya", edgeIndex: 3, start: [34.828390856782086, 41.01264370368176], end: [35.31959064327484, 41.25286549707603] };
function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}
function probe(point){const resolved=resolvePhysicalGeometryBoundaryPoint(point);const land=nearestBoundaryLandPoint(point);const lake=nearestLakeBoundaryPoint(point);return {point,isPhysicalLandPoint:isPhysicalLandPoint(point),isLakeInteriorPoint:isLakeInteriorPoint(point),resolvedPhysicalGeometryBoundaryPoint:resolved,recoveryDistance:resolved?dist(point,resolved):null,nearestLandBoundary:land,nearestLakeBoundary:lake};}
const start=probe(EDGE.start);const end=probe(EDGE.end);
assert.equal(start.isPhysicalLandPoint,true);
assert.equal(end.isPhysicalLandPoint,false);
console.log(JSON.stringify({amasyaEdge3:{...EDGE,start,end}},null,2));
