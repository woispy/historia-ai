import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import historicalAtlas from "../../data/gis/1300/regional/anatolia-byzantium.json" with { type: "json" };
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { createHistoricalPoliticalMapModel } from "../../src/world/map/historical/HistoricalPoliticalMapModel.js";
import { getHistoricalPolity } from "../../src/world/map/historical/HistoricalPoliticalRuntime.js";
import { getHistoricalPoliticalOverlayMode } from "../../src/map/components/layers/HistoricalPoliticalOverlayModel.js";
import { buildCartographicInternalBoundaryPath } from "../../src/map/rendering/historical/HistoricalPoliticalBoundary.js";

const layerSource = readFileSync(
  resolve("src/map/components/layers/HistoricalPoliticalRegionLayer.jsx"),
  "utf8",
);
const boundarySource = readFileSync(
  resolve("src/map/rendering/historical/HistoricalPoliticalBoundary.js"),
  "utf8",
);
const worldMapSource = readFileSync(
  resolve("src/map/components/WorldMap.jsx"),
  "utf8",
);
const provinceLayerSource = readFileSync(
  resolve("src/map/components/layers/ProvinceLayer.jsx"),
  "utf8",
);

assert.match(
  layerSource,
  /clipPath="url\(#world-land-mask\)"/,
  "historical political rendering must be clipped to the physical world land mask",
);
assert.match(
  layerSource,
  /aria-label="Historical unassigned land presentation"/,
  "historical political rendering must provide a visible fallback for land without a source polity",
);
assert.match(
  layerSource,
  /fill=\{DEFAULT_POLITICAL_COLOR\}/,
  "historical unassigned land presentation must use the explicit neutral political colour",
);
assert.match(
  layerSource,
  /COASTAL_POLITICAL_EXPANSION = 0\.08/,
  "curated coastal political fills must have a small controlled expansion before land clipping",
);
assert.match(
  layerSource,
  /stroke=\{color\}/,
  "coastal political expansion must use the owning historical polity colour",
);
assert.match(
  layerSource,
  /buildCartographicInternalBoundaryPath\(provinces\)/,
  "historical political layer must render the shared cartographic boundary geometry",
);
assert.doesNotMatch(
  layerSource,
  /HISTORICAL_POLITICAL_CARTOGRAPHIC_FILTER_ID/,
  "historical province borders must not rely on noisy SVG displacement filters",
);
assert.match(
  boundarySource,
  /C \$\{oneThird\[0\]\}/,
  "cartographic province borders must be rendered as curved shared boundaries",
);
assert.match(
  boundarySource,
  /edge\.provinceIds\.size >= 2/,
  "cartographic boundary construction must render only edges shared by different provinces",
);
assert.match(
  worldMapSource,
  /runtime\?\.world\?\.scenario\?\.startDate/,
  "WorldMap must use the same nested scenario-date contract as the geometry bootstrap",
);
assert.match(
  worldMapSource,
  /renderFill=\{!isHistoricalPoliticalMap\}/,
  "modern province fills must be disabled for the 1300 historical political layer",
);
assert.match(
  worldMapSource,
  /renderBoundaries=\{!isHistoricalPoliticalMap\}/,
  "modern straight province topology must be disabled when the historical cartographic boundary layer is active",
);
assert.match(
  provinceLayerSource,
  /renderBoundaries = true/,
  "ProvinceLayer must expose an explicit boundary-rendering switch",
);
assert.match(
  provinceLayerSource,
  /renderBoundaries && <ProvinceBoundaryLayer/,
  "ProvinceLayer must conditionally render the legacy straight topology",
);

assert.equal(historicalAtlas.historicalDate, "1300-01-01");
assert.ok(Array.isArray(historicalAtlas.regions));
assert.ok(historicalAtlas.regions.length >= 15);

for (const region of historicalAtlas.regions) {
  assert.ok(region.id);
  assert.ok(region.countryId, `${region.id} must have a political display identity`);
  assert.ok(getHistoricalPolity(region.countryId), `${region.id} uses an unregistered historical polity`);
  assert.ok(Array.isArray(region.polygons) && region.polygons.length > 0, `${region.id} needs research geometry`);

  for (const polygon of region.polygons) {
    assert.ok(polygon.length >= 4, `${region.id} polygon is too short`);
    assert.deepEqual(polygon[0], polygon[polygon.length - 1], `${region.id} polygon must be closed`);
  }
}

const runtimeProvinces = ANATOLIA_PROVINCE_METADATA.map((metadata) => ({
  id: metadata.id,
  owner: metadata.countryId ?? null,
}));
const politicalModel = createHistoricalPoliticalMapModel({
  date: "1300-01-01",
  provinces: runtimeProvinces,
  countryRepository: { byId: {} },
});

assert.equal(politicalModel.length, 38, "the 1300 political presentation must cover all 38 provinces");
assert.equal(
  politicalModel.every((entry) => entry.historicalPolitical?.id),
  true,
  "every province must have a visible historical political presentation, including neutral areas",
);
assert.equal(
  politicalModel.every((entry) => /^#[0-9a-f]{6}$/i.test(entry.historicalPolitical?.color ?? "")),
  true,
  "every province presentation must provide an explicit political colour",
);

const byProvince = new Map(politicalModel.map((entry) => [entry.province.id, entry]));
assert.equal(byProvince.get("cappadocia-kayseri").historicalPolitical.id, "ilkhanate");
assert.equal(byProvince.get("cappadocia-kayseri").historicalProvince.controlStatus, "Ilkhanid-suzerainty");
assert.equal(byProvince.get("ionia-ayasuluk").historicalPolitical.id, "byzantium");
assert.equal(byProvince.get("lydia-birgi").historicalPolitical.id, "byzantium");
assert.equal(byProvince.get("phrygia-denizli").historicalPolitical.id, "inanc");
assert.equal(byProvince.get("phrygia-uluborlu").historicalPolitical.id, "hamid");
assert.equal(byProvince.get("phrygia-afyon").historicalPolitical.id, "sahibata");
assert.equal(byProvince.get("bithynia-nicomedia").historicalProvince.coastal, true);
assert.equal(byProvince.get("pontus-sinop").historicalProvince.port, true);

assert.equal(
  getHistoricalPoliticalOverlayMode(byProvince.get("cappadocia-kayseri")),
  "suzerainty",
);
assert.equal(
  getHistoricalPoliticalOverlayMode(byProvince.get("phrygia-eskisehir")),
  "contested",
);
assert.equal(
  getHistoricalPoliticalOverlayMode(byProvince.get("ionia-ayasuluk")),
  "sovereign",
);

const sampleProvinceGeometry = [
  { province: { id: "province-a" }, geometry: { polygons: [[[0, 0], [1, 0], [1, 1], [0, 1]]] } },
  { province: { id: "province-b" }, geometry: { polygons: [[[1, 0], [2, 0], [2, 1], [1, 1]]] } },
];
const cartographicBoundaryPath = buildCartographicInternalBoundaryPath(sampleProvinceGeometry);
assert.match(cartographicBoundaryPath, /^M 1 0 C /);
assert.ok(!cartographicBoundaryPath.includes("M 0 0"), "coast edges must not be promoted to internal province borders");
assert.ok(cartographicBoundaryPath.includes(" 1 1"), "shared province border must retain its geographic endpoints");

const sameProvinceGeometry = [
  { province: { id: "province-a" }, geometry: { polygons: [[[0, 0], [1, 0], [1, 1], [0, 1]]] } },
  { province: { id: "province-a" }, geometry: { polygons: [[[1, 0], [2, 0], [2, 1], [1, 1]]] } },
];
assert.equal(
  buildCartographicInternalBoundaryPath(sameProvinceGeometry),
  "",
  "seams between polygons belonging to the same province must remain invisible",
);

assert.equal(
  historicalAtlas.regions.some((region) => region.id === "anatolia_aydin_pre1308" && region.countryId === "byzantium"),
  true,
  "Aydinid ownership must not be projected backward into 1300",
);
assert.equal(
  historicalAtlas.regions.some((region) => region.countryId === "inanc"),
  true,
  "İnanç Beyliği must remain represented in the research atlas",
);
assert.equal(
  historicalAtlas.regions.some((region) => region.countryId === "hamid"),
  true,
  "Hamid Beyliği must remain represented in the research atlas",
);
assert.equal(
  historicalAtlas.regions.some((region) => region.countryId === "sahibata"),
  true,
  "Sâhib Ata Beyliği must remain represented in the research atlas",
);

console.log(
  `Historical political region layer tests passed: ${politicalModel.length} rendered province presentations plus ${historicalAtlas.regions.length} research regions.`,
);
