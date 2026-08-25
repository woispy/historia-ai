import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import {
  isPhysicalLandPoint,
  isUsablePhysicalLandPoint,
} from "../../src/map/rendering/physical/PhysicalLandAuthority.js";

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

const land = polygons;
const seas = ANATOLIA_PHYSICAL_ATLAS.seas.map((sea) => sea.coordinates);
const channels = ANATOLIA_PHYSICAL_ATLAS.channels.map((channel) => channel.coordinates);
const lakes = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes;

const nicomedia = [29.9169, 40.7654];
const constantinople = [28.9784, 41.0082];
const nicaea = [29.7183, 40.4286];
const prusa = [29.0611, 40.1917];
const izmitGulfWater = [29.60, 40.70];
const bosporusWater = [29.06, 41.05];

assert.equal(isPhysicalLandPoint(nicomedia, land, lakes), true, "Nicomedia must remain on physical land");
assert.equal(isPhysicalLandPoint(constantinople, land, lakes), true, "Constantinople must remain on physical land");
assert.equal(isPhysicalLandPoint(nicaea, land, lakes), true, "Nicaea must remain on physical land");
assert.equal(isPhysicalLandPoint(prusa, land, lakes), true, "Prusa must remain on physical land");

assert.equal(
  isUsablePhysicalLandPoint(izmitGulfWater, land, seas, channels, lakes),
  false,
  "İzmit Gulf water must not become usable physical land.",
);
assert.equal(
  isUsablePhysicalLandPoint(bosporusWater, land, seas, channels, lakes),
  false,
  "Bosporus water must not become usable physical land.",
);
assert.equal(
  isUsablePhysicalLandPoint(nicomedia, land, seas, channels, lakes),
  true,
  "Nicomedia must remain a usable physical-land anchor.",
);

console.log("Physical land topology tests passed: 2 simple land polygons, Bosporus split, direct land anchors, and subtractive water exclusions.");
