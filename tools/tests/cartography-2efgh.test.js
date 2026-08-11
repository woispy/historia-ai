import {
  getMapLod,
  getCityVisibilityTier,
  getPhysicalDetailProfile,
  getProvincePresentation,
} from "../../src/map/rendering/CartographyModel.js";
import {
  ANATOLIA_REGION_LABELS,
  ANATOLIA_STRATEGIC_CORRIDORS,
  ANATOLIA_STRATEGIC_PASSES,
  ANATOLIA_STRATEGIC_CROSSINGS,
} from "../../src/map/data/CartographyAtlas.js";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(getMapLod(0.8) === "world", "world LOD threshold failed");
assert(getMapLod(1.3) === "regional", "regional LOD threshold failed");
assert(getMapLod(2.0) === "province", "province LOD threshold failed");
assert(getMapLod(2.9) === "city", "city LOD threshold failed");
assert(getMapLod(4.0) === "detailed", "detailed LOD threshold failed");

assert(getCityVisibilityTier(0.9) === "capital", "world city tier failed");
assert(getCityVisibilityTier(1.4) === "major", "regional city tier failed");
assert(getCityVisibilityTier(2.0) === "town", "province city tier failed");

const provinceProfile = getProvincePresentation(2.0);
assert(provinceProfile.showProvinceBoundaries, "province boundaries should be visible at province LOD");
assert(getProvincePresentation(0.9).boundaryOpacity < provinceProfile.boundaryOpacity, "world boundaries should be quieter than province boundaries");

const physicalProfile = getPhysicalDetailProfile(2.8);
assert(physicalProfile.rivers && physicalProfile.mountains && physicalProfile.lakes, "province physical details missing");
assert(physicalProfile.waterChannels, "province water channels missing");

assert(ANATOLIA_REGION_LABELS.length === 6, "expected six Anatolia regional labels");
assert(ANATOLIA_STRATEGIC_CORRIDORS.length >= 9, "strategic corridor atlas is incomplete");
assert(ANATOLIA_STRATEGIC_PASSES.length >= 5, "strategic pass atlas is incomplete");
assert(ANATOLIA_STRATEGIC_CROSSINGS.length >= 7, "strategic crossing atlas is incomplete");

for (const corridor of ANATOLIA_STRATEGIC_CORRIDORS) {
  assert(corridor.points.length >= 3, `${corridor.id} needs at least three control points`);
  for (const [x, y] of corridor.points) {
    assert(Number.isFinite(x) && Number.isFinite(y), `${corridor.id} contains invalid coordinates`);
  }
}

for (const city of Object.values(ANATOLIA_CITY_ATLAS)) {
  assert(Number.isFinite(city.x) && Number.isFinite(city.y), `${city.name} has invalid coordinates`);
}

console.log(`Phase 2E-2H cartography tests passed: ${ANATOLIA_REGION_LABELS.length} regions, ${ANATOLIA_STRATEGIC_CORRIDORS.length} corridors, ${ANATOLIA_STRATEGIC_PASSES.length} passes, ${ANATOLIA_STRATEGIC_CROSSINGS.length} crossings.`);
