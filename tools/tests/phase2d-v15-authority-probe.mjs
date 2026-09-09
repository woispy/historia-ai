import assert from "node:assert/strict";
import { buildAnatoliaPhase2DAssets } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import {
  isPhysicalLandPoint,
  resolvePhysicalGeometryBoundaryPoint,
  nearestBoundaryLandPoint,
} from "../historical-gis/recovery/physical-land-authority.mjs";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";

const TARGETS = ["lydia-smyrna", "ionia-ayasuluk", "caria-pecin", "caria-halikarnassos", "pontus-sinop", "pontus-amisos"];
const FAILURE_EDGES = [
  { provinceId: "bithynia-nicomedia", edgeIndex: 0, start: [29.87953, 40.72476], end: [29.88817, 40.72993] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [29.88817, 40.72993], end: [29.91915, 40.71851] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 0, start: [29.94879, 40.71649], end: [29.96697, 40.7418] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 2, start: [29.87953, 40.72476], end: [29.85423, 40.7623] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 1, start: [29.96697, 40.7418], end: [29.94879, 40.71649] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [29.99643, 40.72103], end: [30.01852, 40.70688] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [30.01852, 40.70688], end: [29.99643, 40.72103] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 1, start: [30.02342, 40.70087], end: [30.06008, 40.71516] },
  { provinceId: "bithynia-nicaea", edgeIndex: 0, start: [29.91915, 40.71851], end: [29.88817, 40.72993] },
];
function area(polygon) { let s=0; for(let i=0;i<polygon.length;i++){const n=polygon[(i+1)%polygon.length];s+=polygon[i][0]*n[1]-n[0]*polygon[i][1];} return Math.abs(s)/2; }
function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}
function edgeLength(a,b){return dist(a,b);}
function canonicalMetrics() {
  const result = buildAnatoliaPhase2DAssets([]);
  return Object.fromEntries(result.geometries.map(g => [g.identity.provinceId, g.polygons[0]]));
}
const canonical = canonicalMetrics();
assert.equal(Object.keys(canonical).length, 38);

const six = Object.fromEntries(TARGETS.map(id => [id, {
  canonicalVertexCount: canonical[id]?.length ?? 0,
  canonicalArea: canonical[id] ? area(canonical[id]) : null,
}]));

const authorityProbe = FAILURE_EDGES.map(({ provinceId, edgeIndex, start, end }) => {
  const startLand = isPhysicalLandPoint(start);
  const endLand = isPhysicalLandPoint(end);
  const resolvedStart = resolvePhysicalGeometryBoundaryPoint(start);
  const resolvedEnd = resolvePhysicalGeometryBoundaryPoint(end);
  const nearestStart = nearestBoundaryLandPoint(start);
  const nearestEnd = nearestBoundaryLandPoint(end);
  return {
    provinceId, edgeIndex, start, end,
    edgeLength: edgeLength(start,end),
    startLand, endLand,
    resolvedStart, resolvedEnd,
    startRecoveryDistance: resolvedStart ? dist(start,resolvedStart) : null,
    endRecoveryDistance: resolvedEnd ? dist(end,resolvedEnd) : null,
    nearestStart: nearestStart?.point ?? null,
    nearestStartDistance: nearestStart?.distance ?? null,
    nearestEnd: nearestEnd?.point ?? null,
    nearestEndDistance: nearestEnd?.distance ?? null,
  };
});

const report = { six, authorityProbe, atlasPolygonCount: ANATOLIA_PHYSICAL_ATLAS.landPolygons.length };
console.log(JSON.stringify(report, null, 2));
