import assert from "node:assert/strict";
import { createDemProvenance, COPERNICUS_DEM_PRODUCTS } from "./CopernicusDemSource.js";
import { decodeGeoTiffDem } from "./DemBinaryDecoder.js";

function makeFixture() {
  const buffer = new ArrayBuffer(512);
  const view = new DataView(buffer);
  view.setUint16(0, 0x4949, false); view.setUint16(2, 42, true); view.setUint32(4, 8, true);
  const ifd = 8; view.setUint16(ifd, 13, true);
  const tags = [
    [256, 4, 1, 2], [257, 4, 1, 2], [258, 3, 1, 16], [259, 3, 1, 1], [273, 4, 1, 320],
    [277, 3, 1, 1], [278, 4, 1, 2], [279, 4, 1, 8], [339, 3, 1, 2],
    [33550, 12, 3, 200], [33922, 12, 6, 224], [34735, 3, 8, 272], [42113, 2, 5, 288],
  ];
  tags.forEach(([tag, type, count, value], index) => {
    const offset = ifd + 2 + index * 12;
    view.setUint16(offset, tag, true); view.setUint16(offset + 2, type, true); view.setUint32(offset + 4, count, true);
    if (type === 3) view.setUint16(offset + 8, value, true); else view.setUint32(offset + 8, value, true);
  });
  view.setFloat64(200, 90, true); view.setFloat64(208, 90, true); view.setFloat64(216, 0, true);
  [30, 38, 0, 30, 37, 0].forEach((value, i) => view.setFloat64(224 + i * 8, value, true));
  [1, 1, 0, 1, 2048, 0, 1, 0].forEach((value, i) => view.setUint16(272 + i * 2, value, true));
  new Uint8Array(buffer, 288, 5).set(new TextEncoder().encode("-9999"));
  view.setInt16(320, 100, true); view.setInt16(322, 110, true); view.setInt16(324, 120, true); view.setInt16(326, 130, true);
  return buffer;
}

const provenance = createDemProvenance({ tileId: "N37_E030", product: COPERNICUS_DEM_PRODUCTS.GLO90, resolutionMeters: 90 });
const result = decodeGeoTiffDem(makeFixture(), {
  crs: "EPSG:4326",
  resolutionMeters: 90,
  bounds: { minX: 30, minY: 37, maxX: 31, maxY: 38 },
  provenance,
});
assert.equal(result.metadata.container, "GeoTIFF");
assert.equal(result.metadata.width, 2);
assert.equal(result.metadata.height, 2);
assert.equal(result.metadata.sampleType, "int16");
assert.equal(result.metadata.noDataValue, -9999);
assert.deepEqual(Array.from(result.samples), [100, 110, 120, 130]);
assert.deepEqual(result.georeferencing.pixelScale, [90, 90, 0]);
assert.deepEqual(result.georeferencing.tiepoint, [30, 38, 0, 30, 37, 0]);
assert.deepEqual(result.georeferencing.geoKeys, [1, 1, 0, 1, 2048, 0, 1, 0]);

assert.throws(() => decodeGeoTiffDem(new ArrayBuffer(4), { crs: "EPSG:4326", resolutionMeters: 90, bounds: { minX: 30, minY: 37, maxX: 31, maxY: 38 }, provenance }), /truncated/);
console.log("Phase E DEM binary decoder: PASS");
