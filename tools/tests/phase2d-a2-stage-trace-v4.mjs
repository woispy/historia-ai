import assert from "node:assert/strict";
import { traceAnatoliaPhase2DProvince } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";

const id = "pontus-amisos";
const trace = traceAnatoliaPhase2DProvince(id, []);
assert.equal(trace.provinceId, id);
assert.ok(trace.cells.length > 0, "expected at least one political cell for Pontus-Amisos");

const stats = (polygon) => ({
  vertexCount: polygon.length,
  area: polygon.length >= 3
    ? Math.abs(polygon.reduce((sum, point, index) => {
      const next = polygon[(index + 1) % polygon.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0) / 2)
    : 0,
  vertices: polygon,
});

const cells = trace.cells.map((cell) => ({
  siteIndex: cell.siteIndex,
  site: cell.site,
  raw: stats(cell.raw),
  rawArea: cell.rawArea,
  centroid: cell.centroid,
  centroidPhysicalLand: cell.centroidPhysicalLand,
  rawAllPhysicalLand: cell.rawAllPhysicalLand,
  rawAcceptedByBuilder: cell.rawAcceptedByBuilder,
  rounded: stats(cell.rounded),
  roundedArea: cell.roundedArea,
  roundedAllPhysicalLand: cell.roundedAllPhysicalLand,
}));

const smallestRaw = [...cells].sort((a, b) => a.rawArea - b.rawArea)[0];
const accepted = cells.filter((cell) => cell.rawAcceptedByBuilder && cell.roundedAllPhysicalLand);

console.log(JSON.stringify({
  phase: "A2 exact raw -> validation -> rounding stage trace",
  target: id,
  siteCount: trace.siteCount,
  politicalSiteCount: trace.politicalSiteCount,
  cellCount: cells.length,
  smallestRawCell: smallestRaw,
  acceptedCellCount: accepted.length,
  acceptedCells: accepted,
  historicalTinyAreaMatch: cells.filter((cell) => cell.rawArea < 1e-10 || cell.roundedArea < 1e-10),
}, null, 2));
