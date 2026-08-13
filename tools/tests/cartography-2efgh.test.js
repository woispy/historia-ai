import {
  getMapLod,
  getCityVisibilityTier,
  getPhysicalDetailProfile,
  getProvincePresentation,
  getCityLabelPolicy,
  getPhysicalPresentation,
} from "../../src/map/rendering/CartographyModel.js";
import {
  ANATOLIA_REGION_LABELS,
  ANATOLIA_STRATEGIC_CORRIDORS,
  ANATOLIA_STRATEGIC_PASSES,
  ANATOLIA_STRATEGIC_CROSSINGS,
} from "../../src/map/data/CartographyAtlas.js";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";
import {
  boxesOverlap,
  getCityLabelBudget,
  getCityMarkerBudget,
  getCityVisualStyle,
  layoutCityLabels,
  selectVisibleCities,
} from "../../src/map/rendering/city/CityLabelLayout.js";

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
assert(!physicalProfile.waterChannels, "water channels must remain disabled while the GPU land mask owns the coastline");

const physicalPresentation = getPhysicalPresentation(2.8);
assert(physicalPresentation.terrainOpacity === 0, "terrain overlays must remain disabled until they are mask-clipped");
assert(physicalPresentation.riverOpacity > 0 && physicalPresentation.mountainOpacity > 0, "physical presentation profile is incomplete");

assert(getCityLabelPolicy(0.9).maxLabels < getCityLabelPolicy(3.6).maxLabels, "city label budget should grow with zoom");
assert(getCityLabelBudget(1.3) === 12, "regional label budget failed");
assert(getCityMarkerBudget(2.0) === 26, "province marker budget failed");

const cities = Object.entries(ANATOLIA_CITY_ATLAS).map(([id, map]) => ({ id, map }));
const regionalCities = selectVisibleCities(cities, 1.4);
const detailedCities = selectVisibleCities(cities, 4.0);
assert(regionalCities.length <= getCityMarkerBudget(1.4), "regional city marker budget exceeded");
assert(detailedCities.length <= getCityMarkerBudget(4.0), "detailed city marker budget exceeded");
assert(regionalCities[0]?.map?.tier === "capital", "highest priority regional city should be a capital");

const capital = { id: "capital", map: { name: "Konstantinopolis", x: 28.9784, y: 41.0082, tier: "capital" } };
const nearby = { id: "nearby", map: { name: "Nikaia", x: 29.01, y: 41.01, tier: "major" } };
const far = { id: "far", map: { name: "Dorylaion", x: 30.52, y: 39.77, tier: "major" } };
const labels = layoutCityLabels([capital, nearby, far], 2.9);
assert(labels.some((label) => label.city.id === "capital"), "capital label should survive collision layout");
assert(labels.length <= getCityLabelBudget(2.9), "collision layout exceeded label budget");
assert(getCityVisualStyle(capital, 8).fontSize < getCityVisualStyle(capital, 2).fontSize, "deep zoom should not inflate label size");
assert(boxesOverlap({ left: 0, right: 1, top: 0, bottom: 1 }, { left: 0.9, right: 2, top: 0, bottom: 1 }), "overlap predicate failed");
assert(!boxesOverlap({ left: 0, right: 1, top: 0, bottom: 1 }, { left: 1.2, right: 2, top: 0, bottom: 1 }), "overlap predicate false positive");

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
