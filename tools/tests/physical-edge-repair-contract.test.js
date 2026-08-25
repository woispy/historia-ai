import assert from "node:assert/strict";

import { repairPhysicalPolygon } from "../historical-gis/recovery/physical-edge-repair-v3.mjs";
import { isPhysicalLandPoint, isFinalPhysicalGeometryBoundaryPoint } from "../historical-gis/recovery/physical-land-authority.mjs";

const knownPhrygiaEskisehir = [
  [30.4729109648, 39.2531915815],
  [30.1846330275, 39.6936162080],
  [30.3402604167, 39.9270572917],
  [31.6838198515, 39.9881281751],
  [31.7259670816, 39.2896883616],
];

const knownBithyniaSangarios = [
  [31.68, 40.8],
  [31.7118776978, 40.8053129496],
  [31.6838198515, 39.9881281751],
  [30.3402604167, 39.9270572917],
  [30.3487472284, 40.0755764967],
  [30.5954155977, 40.6840251411],
  [30.5968358603, 40.6851318392],
  [30.72, 40.68],
  [31.2, 40.73],
];

const knownErzincanPhysicalEdge = [
  [42.41403524154731, 38.59821378997495],
  [42.6039441887917, 36.35005011323657],
  [42.1, 36.22],
  [41.48, 36.1],
  [40.8965493257, 35.9939180592],
  [40.3668203889, 36.8437875274],
  [40.3668203889, 38.9766619798],
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

function assertPhysicalPath(polygon, label, original) {
  assert.ok(polygon.length >= 3, `${label}: repaired polygon must have at least three vertices`);
  assert.ok(area(polygon) > 0.00005, `${label}: repaired polygon must retain non-trivial area`);
  assert.ok(area(polygon) >= area(original) * 0.05, `${label}: repair must retain at least 5% of source area`);
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

for (const [label, polygon, options] of [
  ["phrygia-eskisehir", knownPhrygiaEskisehir, undefined],
  ["bithynia-sangarios", knownBithyniaSangarios, undefined],
  ["eastern-anatolia-erzincan-source-constrained", knownErzincanPhysicalEdge, { containmentPolygon: knownErzincanPhysicalEdge }],
]) {
  const repaired = repairPhysicalPolygon(polygon, options);
  assertPhysicalPath(repaired, label, polygon);
  if (options?.containmentPolygon) {
    assert.ok(repaired.every((point) => {
      const source = options.containmentPolygon;
      let inside = false;
      for (let index = 0, previous = source.length - 1; index < source.length; previous = index++) {
        const a = source[index];
        const b = source[previous];
        if ((a[1] > point[1]) !== (b[1] > point[1])
          && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || Number.EPSILON) + a[0]) inside = !inside;
      }
      return inside || source.some((sourcePoint) => Math.hypot(sourcePoint[0] - point[0], sourcePoint[1] - point[1]) < 1e-7);
    }), `${label}: repaired vertices escaped source containment polygon`);
  }
  console.log(`Physical edge repair contract passed: ${label} ${polygon.length}→${repaired.length} vertices.`);
}
