import assert from "node:assert/strict";
import { createDemProvenance, COPERNICUS_DEM_PRODUCTS } from "./CopernicusDemSource.js";
import { decodeGeoTiffDem } from "./DemBinaryDecoder.js";

function makeFixture() {
  const buffer = new ArrayBuffer(256);
  const view = new DataView(buffer);
  view.setUint16(0, 0x4949, false); view.setUint16(2, 42, true); view.setUint32(4, 8, true);
  const ifd = 8; view.setUint16(ifd, 8, true);
  const tags = [
    [256, 4, 1, 2], [257, 4, 1, 2], [258, 3, 1, 16], [273, 4, 1, 120],
    [277, 3, 1, 1], [278, 4, 1, 2], [279, 4, 1, 8], [339, 3, 1, 2],
  ];
  tags.forEach(([tag, type, count, value], index) => {
    const offset = ifd + 2 + index * 12;
    view.setUint16(offset, tag, true); view.setUint16(offset + 2, type, true); view.setUint32(offset + 4, count, true);
    if (type === 3) view.setUint16(offset + 8, value, true); else view.setUint32(offset + 8, value, true);
  });
  view.setInt16(120, 100, true); view.setInt16(122, 110, true); view.setInt16(124, 120, true); view.setInt16(126, 130, true);
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
assert.deepEqual(Array.from(result.samples), [100, 110, 120, 130]);
assert.equal(result.min, 100);
assert.equal(result.max, 130);

assert.throws(() => decodeGeoTiffDem(new ArrayBuffer(4), { crs: "EPSG:4326", resolutionMeters: 90, bounds: { minX: 30, minY: 37, maxX: 31, maxY: 38 }, provenance }), /truncated/);
console.log("Phase E DEM binary decoder: PASS");
