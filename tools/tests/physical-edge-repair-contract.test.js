import assert from "node:assert/strict";

import { repairPhysicalPolygon } from "../historical-gis/recovery/physical-edge-repair-v2.mjs";
import { isPhysicalLandPoint, isFinalPhysicalGeometryBoundaryPoint } from "../historical-gis/recovery/physical-land-authority.mjs";

const knownPhrygiaEskisehir = [
  [30.4729109648, 39.2531915815],
  [30.1846330275, 39.6936162080],
  [30.3402604167, 39.9270572917],
  [31.6838198515, 39.9881281751],
  [31.7259670816, 39.2896883616],
];

function area(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(sum) / 2;
}

function isPhysicalPoint(point) {
  return isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point);
}

function assertPhysicalPath(polygon, label) {
  assert.ok(polygon.length >= 3, `${label}: repaired polygon must have at least three vertices`);
  assert.ok(area(polygon) > 0.00005, `${label}: repaired polygon must retain non-trivial area`);
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    assert.ok(isPhysicalPoint(start), `${label}: vertex ${index} is not physically authoritative`);
    assert.ok(isPhysicalPoint(end), `${label}: endpoint ${index} is not physically authoritative`);
    for (const fraction of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const point = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      assert.ok(isPhysicalPoint(point), `${label}: repaired edge ${index} leaves physical geometry at ${fraction}`);
    }
  }
}

const repaired = repairPhysicalPolygon(knownPhrygiaEskisehir);
assertPhysicalPath(repaired, "phrygia-eskisehir");

assert.ok(
  area(repaired) >= area(knownPhrygiaEskisehir) * 0.05,
  "phrygia-eskisehir repair must not collapse the historical partition cell",
);

console.log(`Physical edge repair contract passed: Phrygia/Eskisehir ${knownPhrygiaEskisehir.length}→${repaired.length} vertices.`);