import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";

function pointInPolygon([x, y], polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function orientation(a, b, c) {
  const value = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return Math.sign(value);
}

function segmentsIntersect(a, b, c, d) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  return abC * abD < 0 && cdA * cdB < 0;
}

function hasSelfIntersection(polygon) {
  for (let first = 0; first < polygon.length; first += 1) {
    const firstEnd = (first + 1) % polygon.length;
    for (let second = first + 1; second < polygon.length; second += 1) {
      const secondEnd = (second + 1) % polygon.length;
      if (first === second || firstEnd === second || secondEnd === first) continue;
      if (segmentsIntersect(polygon[first], polygon[firstEnd], polygon[second], polygon[secondEnd])) return true;
    }
  }
  return false;
}

const polygons = ANATOLIA_PHYSICAL_ATLAS.landPolygons;
assert.equal(polygons.length, 2, "Physical land authority must remain a MultiPolygon at the Bosporus");
assert.ok(polygons.every((polygon) => polygon.length >= 4), "Every physical land ring must be valid");
assert.ok(polygons.every((polygon) => !hasSelfIntersection(polygon)), "Physical land rings must not self-intersect");

const nicomedia = [29.9169, 40.7654];
const constantinople = [28.9784, 41.0082];
const nicaea = [29.7183, 40.4286];
const prusa = [29.0611, 40.1917];

assert.ok(polygons.some((polygon) => pointInPolygon(nicomedia, polygon)), "Nicomedia must remain on Anatolian physical land");
assert.ok(polygons.some((polygon) => pointInPolygon(constantinople, polygon)), "Constantinople must remain on physical land");
assert.ok(polygons.some((polygon) => pointInPolygon(nicaea, polygon)), "Nicaea must remain on Anatolian physical land");
assert.ok(polygons.some((polygon) => pointInPolygon(prusa, polygon)), "Prusa must remain on Anatolian physical land");

const izmitGulfWater = [29.60, 40.70];
const bosporusWater = [29.06, 41.05];
assert.ok(!polygons.some((polygon) => pointInPolygon(izmitGulfWater, polygon)), "İzmit Gulf water must not become physical land");
assert.ok(!polygons.some((polygon) => pointInPolygon(bosporusWater, polygon)), "Bosporus water must not become physical land");

console.log("Physical land topology tests passed: 2 simple land polygons, Bosporus split, Nicomedia/Constantinople/Nicaea/Prusa anchors, and water exclusions.");
