import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import {
  isPhysicalLandPoint,
  isUsablePhysicalLandPoint,
} from "../../src/map/rendering/physical/PhysicalLandAuthority.js";

const land = ANATOLIA_PHYSICAL_ATLAS.landPolygons;
const seas = ANATOLIA_PHYSICAL_ATLAS.seas.map((sea) => sea.coordinates);
const channels = ANATOLIA_PHYSICAL_ATLAS.channels.map((channel) => channel.coordinates);
const lakes = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes;

const nicomedia = [29.9169, 40.7654];
const constantinople = [28.9784, 41.0082];
const nicaea = [29.7183, 40.4286];
const prusa = [29.0611, 40.1917];
const izmitGulfWater = [29.60, 40.70];
const bosporusWater = [29.06, 41.05];

assert.equal(isPhysicalLandPoint(nicomedia, land, lakes), true);
assert.equal(isPhysicalLandPoint(constantinople, land, lakes), true);
assert.equal(isPhysicalLandPoint(nicaea, land, lakes), true);
assert.equal(isPhysicalLandPoint(prusa, land, lakes), true);

assert.equal(
  isUsablePhysicalLandPoint(nicomedia, land, seas, channels, lakes),
  true,
  "Nicomedia must survive water subtraction because it is outside the Gulf of İzmit water geometry.",
);
assert.equal(
  isUsablePhysicalLandPoint(izmitGulfWater, land, seas, channels, lakes),
  false,
  "Gulf of İzmit water must never become a usable province surface even when the coarse land envelope contains it.",
);
assert.equal(
  isUsablePhysicalLandPoint(bosporusWater, land, seas, channels, lakes),
  false,
  "Bosporus water must never become a usable province surface.",
);

console.log("Physical land authority tests passed: direct land anchors, subtractive sea/channel water, and Nicomedia/Gulf separation.");
