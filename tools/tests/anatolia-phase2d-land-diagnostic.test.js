import assert from "node:assert/strict";
import { isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";

const point = [29.9169, 40.7654];

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

const landHits = ANATOLIA_PHYSICAL_ATLAS.landPolygons
  .map((polygon, index) => pointInPolygon(point, polygon) ? index : null)
  .filter((index) => index !== null);
const seaHits = ANATOLIA_PHYSICAL_ATLAS.seas
  .filter((sea) => pointInPolygon(point, sea.coordinates))
  .map((sea) => sea.name);
const channelHits = (ANATOLIA_PHYSICAL_ATLAS.channels ?? [])
  .filter((channel) => pointInPolygon(point, channel.coordinates))
  .map((channel) => channel.name);
const lakeHits = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes
  .filter((lake) => (lake.rings ?? [lake.coordinates]).some((ring) => pointInPolygon(point, ring)))
  .map((lake) => lake.name);

console.log(JSON.stringify({
  point,
  builderIsPhysicalLand: isPhysicalLandPoint(point),
  landHits,
  seaHits,
  channelHits,
  lakeHits,
}, null, 2));

assert.ok(landHits.length > 0, "Nicomedia anchor must be inside the physical land authority");
assert.equal(seaHits.length, 0, "Nicomedia anchor must not be classified as sea");
assert.equal(lakeHits.length, 0, "Nicomedia anchor must not be classified as lake");
