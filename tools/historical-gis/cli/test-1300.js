import assert from "node:assert/strict";

import { normalizeHistoricalFeature } from "../HistoricalGeometryImporter.js";
import {
  buildHistoricalGeometryAsset,
  buildHistoricalProvinceAsset,
  buildCuratedRegionalAssets,
} from "../HistoricalProvinceAssetBuilder.js";
import regionalLayer from "../../../data/gis/1300/regional/anatolia-byzantium.json" with { type: "json" };
import { ANATOLIA_CITY_ATLAS } from "../../../src/map/data/AnatoliaCityAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../../src/map/data/AnatoliaPhysicalAtlas.js";
import {
  normalizeHistoricalCountryName,
  resolveCanonicalHistoricalCountryId,
  resolveHistoricalCountryId,
} from "../../../src/world/historical/HistoricalCountryResolver.js";
import { createCameraModel } from "../../../src/map/camera/CameraModel.js";
import { getWheelZoomDelta } from "../../../src/map/camera/CameraZoom.js";
import { moveCamera, setCameraZoom, zoomCamera } from "../../../src/map/camera/CameraActions.js";
import { DEFAULT_SETTINGS } from "../../../src/components/GameShell/SettingsMenu/SettingsConfig.js";

const duplicateNameFeatures = [
  {
    type: "Feature",
    properties: { NAME: "Thule", SUBJECTO: "Thule", PARTOF: "Thule" },
    geometry: { type: "Polygon", coordinates: [[[-80, 60], [-79, 60], [-79, 61], [-80, 60]]] },
  },
  {
    type: "Feature",
    properties: { NAME: "Thule", SUBJECTO: "Thule", PARTOF: "Thule" },
    geometry: { type: "Polygon", coordinates: [[[-70, 60], [-69, 60], [-69, 61], [-70, 60]]] },
  },
];

const regions = duplicateNameFeatures.map((feature, index) => normalizeHistoricalFeature(feature, index, 1300));
assert.equal(regions.length, 2);
assert.notEqual(regions[0].assetId, regions[1].assetId);
assert.equal(regions[0].sourceFeatureIndex, 0);
assert.equal(regions[1].sourceFeatureIndex, 1);

const province = buildHistoricalProvinceAsset(regions[0]);
const geometry = buildHistoricalGeometryAsset(regions[0]);
assert.equal(province.identity.id, geometry.identity.id);
assert.equal(province.references.geometryId, geometry.identity.id);
assert.equal(province.historical.sourceFeatureIndex, 0);
assert.equal(geometry.metadata.sourceFeatureIndex, 0);

const regionalAssets = buildCuratedRegionalAssets(regionalLayer);
assert.equal(regionalAssets.length, regionalLayer.regions.length);
assert.equal(regionalAssets.length, 16);
assert.equal(regionalAssets.find(({ province: asset }) => asset.identity.id === "anatolia_ottomans").province.ownership.countryId, "ottomans");
assert.equal(regionalAssets.find(({ province: asset }) => asset.identity.id === "anatolia_byzantium_bithynia").province.ownership.countryId, "byzantium");
assert.ok(regionalAssets.every(({ province: asset }) => asset.historical.precision === "approximate"));
assert.ok(regionalAssets.every(({ province: asset }) => asset.historical.borderPrecision <= 2));
assert.equal(ANATOLIA_PHYSICAL_ATLAS.landPolygons.length, 1);
assert.ok(ANATOLIA_PHYSICAL_ATLAS.landPolygons[0].length >= 100);
assert.ok(ANATOLIA_CITY_ATLAS.konstantinopolis);
assert.ok(ANATOLIA_CITY_ATLAS.bursa);
assert.ok(ANATOLIA_CITY_ATLAS.trabzon);
assert.ok(Object.keys(ANATOLIA_CITY_ATLAS).length >= 35);
assert.ok(Object.values(ANATOLIA_CITY_ATLAS).every((city) => Number.isFinite(city.x) && Number.isFinite(city.y)));

assert.equal(normalizeHistoricalCountryName("Đại Viet"), "dai viet");
assert.equal(resolveCanonicalHistoricalCountryId("Byzantine Empire"), "byzantium");
assert.equal(resolveCanonicalHistoricalCountryId("Mamluke Sultanate"), "mamluks");
assert.equal(resolveCanonicalHistoricalCountryId("Great Khanate"), "yuan");
assert.equal(resolveCanonicalHistoricalCountryId("Aydinogullari"), "aydin");
assert.equal(resolveCanonicalHistoricalCountryId("Saruhanogullari"), "saruhan");
assert.equal(resolveCanonicalHistoricalCountryId("Unknown polity"), null);
assert.equal(resolveHistoricalCountryId("Test Realm", {
  test_kingdom: { id: "test_kingdom", name: "Test Kingdom", aliases: ["Test Realm"] },
}), "test_kingdom");

const unsupported = normalizeHistoricalFeature(
  { type: "Feature", properties: { NAME: "Invalid" }, geometry: { type: "Point", coordinates: [0, 0] } },
  10,
  1300,
);
assert.equal(unsupported, null);

const antarctica = normalizeHistoricalFeature(
  {
    type: "Feature",
    properties: { NAME: "Antarctica" },
    geometry: { type: "Polygon", coordinates: [[[-30, -90], [30, -90], [30, -60], [-30, -90]]] },
  },
  11,
  1300,
);
const antarcticaLatitudes = antarctica.polygons[0].map(([, latitude]) => latitude);
const antarcticaLatitudeSpan = Math.max(...antarcticaLatitudes) - Math.min(...antarcticaLatitudes);
assert.ok(Math.abs(antarcticaLatitudeSpan - 5.4) < 1e-9);

const viewport = { width: 1200, height: 700 };
const camera = createCameraModel();
const draggedDown = moveCamera(camera, 0, 100, viewport);
const draggedUp = moveCamera(camera, 0, -100, viewport);
assert.ok(draggedDown.y > camera.y, "Dragging down must move the map south/down.");
assert.ok(draggedUp.y < camera.y, "Dragging up must move the map north/up.");
assert.equal(setCameraZoom(camera, 150, viewport).zoom, 40);
assert.equal(setCameraZoom(camera, 0, viewport).zoom, 0.85);

const lowWheelDelta = getWheelZoomDelta({ deltaY: -100, deltaMode: 0 }, 4);
const highWheelDelta = getWheelZoomDelta({ deltaY: -100, deltaMode: 0 }, 60);
assert.ok(lowWheelDelta > 0);
assert.ok(highWheelDelta > lowWheelDelta);
assert.ok(Math.abs(highWheelDelta / lowWheelDelta - 15) < 1e-9);

const lowZoom = setCameraZoom(camera, 4, viewport);
const highZoom = setCameraZoom(camera, 40, viewport);
assert.equal(zoomCamera(lowZoom, 1.5, viewport).zoom - lowZoom.zoom, 1.5);
assert.equal(zoomCamera(highZoom, 1.5, viewport).zoom - highZoom.zoom, 0);
assert.equal(zoomCamera(highZoom, -1.5, viewport).zoom - highZoom.zoom, -1.5);

assert.equal(DEFAULT_SETTINGS.advisorAutoOpen, undefined);
assert.equal(DEFAULT_SETTINGS.tips, true);
assert.equal(DEFAULT_SETTINGS.smoothCamera, true);
assert.equal(DEFAULT_SETTINGS.mapShadows, true);
assert.equal(DEFAULT_SETTINGS.notifications, true);
assert.equal(DEFAULT_SETTINGS.autosave, "6m");

console.log("Historical GIS 1300 identity, Anatolia map, city atlas, physical atlas, camera, projection and settings tests passed.");
