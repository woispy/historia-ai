import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";
import { getPhysicalLandPolygons, isPhysicalLandPoint, pointInPolygon, polygonArea } from "../historical-gis/Phase2DPhysicalMask.js";
import { convexCellMaskIntersection } from "../historical-gis/Phase2DConvexMaskIntersection.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const EDGE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const refinementFor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id] ?? null;
const anchorFor = (item) => refinementFor(item)?.geometryAnchor ?? refinementFor(item)?.anchor ?? item.centroid;
function halfPlane(polygon, a, b, c) {
  const output = [];
  const inside = (point) => a * point[0] + b * point[1] <= c + EPS;
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i]; const next = polygon[(i + 1) % polygon.length];
    const currentInside = inside(current); const nextInside = inside(next);
    if (currentInside && nextInside) output.push(next);
    else if (currentInside !== nextInside) {
      const currentValue = a * current[0] + b * current[1] - c; const nextValue = a * next[0] + b * next[1] - c;
      const t = Math.abs(currentValue - nextValue) < EPS ? 0 : currentValue / (currentValue - nextValue);
      output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
      if (!currentInside && nextInside) output.push(next);
    }
  }
  return output;
}
function powerCell(index, sites) {
  const site = sites[index].point;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let other = 0; other < sites.length; other += 1) {
    if (other === index) continue;
    const otherPoint = sites[other].point;
    const candidate = halfPlane(polygon, 2 * (otherPoint[0] - site[0]), 2 * (otherPoint[1] - site[1]), otherPoint[0] ** 2 + otherPoint[1] ** 2 - site[0] ** 2 - site[1] ** 2);
    if (candidate.length >= 3 && pointInPolygon(site, candidate)) polygon = candidate;
  }
  return polygon;
}
function edgeFailures(polygon) {
  const failures = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const start = polygon[i]; const end = polygon[(i + 1) % polygon.length];
    for (const fraction of EDGE_FRACTIONS) {
      const point = [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
      if (!isPhysicalLandPoint(point)) failures.push({ edge: i, fraction, point });
    }
  }
  return failures;
}

const item = ANATOLIA_PROVINCE_METADATA.find((entry) => entry.id === "bithynia-nicomedia");
assert.ok(item);
const sites = ANATOLIA_PROVINCE_METADATA.map((entry) => ({ point: anchorFor(entry), provinceId: entry.id }));
const site = sites.find((entry) => entry.provinceId === item.id);
const cell = powerCell(sites.indexOf(site), sites);
const anchor = site.point;
const candidates = [];
for (const land of getPhysicalLandPolygons()) {
  const intersection = convexCellMaskIntersection(cell, land, anchor);
  if (intersection.length < 3) continue;
  candidates.push({
    area: polygonArea(intersection),
    containsAnchor: pointInPolygon(anchor, intersection),
    physicalVertices: intersection.every(isPhysicalLandPoint),
    edgeFailures: edgeFailures(intersection),
    intersection,
  });
}
candidates.sort((a, b) => b.area - a.area);
console.log(JSON.stringify({ anchor, anchorInCell: pointInPolygon(anchor, cell), cell, candidates: candidates.slice(0, 8) }));
assert.ok(pointInPolygon(anchor, cell), "Nicomedia anchor must remain inside its power cell");
assert.ok(candidates.some((candidate) => candidate.containsAnchor), "a physical intersection containing the anchor must exist");
const anchored = candidates.find((candidate) => candidate.containsAnchor);
assert.ok(anchored.physicalVertices, "anchored physical intersection vertices must be land");
assert.equal(anchored.edgeFailures.length, 0, "anchored physical intersection edges must remain on land");
