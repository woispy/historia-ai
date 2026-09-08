import assert from "node:assert/strict";

import { createWgs84ElevationSampler } from "../historical-gis/WGS84ElevationSampler.js";

const WIDTH = 3601;
const HEIGHT = 3601;
const PIXELS = WIDTH * HEIGHT;
const RASTER_BYTES = PIXELS * 4;

function makeDemFixture() {
  const ifdOffset = 8;
  const entryCount = 13;
  const ifdSize = 2 + entryCount * 12 + 4;
  let cursor = ifdOffset + ifdSize;
  const external = [];
  const reserve = (buffer) => {
    const offset = cursor;
    external.push({ offset, buffer });
    cursor += buffer.length;
    if (cursor % 2) cursor += 1;
    return offset;
  };
  const doubles = (values) => {
    const buffer = Buffer.alloc(values.length * 8);
    values.forEach((value, index) => buffer.writeDoubleLE(value, index * 8));
    return reserve(buffer);
  };
  const shorts = (values) => {
    const buffer = Buffer.alloc(values.length * 2);
    values.forEach((value, index) => buffer.writeUInt16LE(value, index * 2));
    return reserve(buffer);
  };
  const ascii = (value) => reserve(Buffer.from(`${value}\0`, "ascii"));

  const scaleOffset = doubles([1 / 3600, 1 / 3600, 0]);
  const tiepointOffset = doubles([0, 0, 0, 30, 41, 0]);
  const geoKeys = shorts([
    1, 1, 0, 5,
    1024, 0, 1, 2,
    1025, 0, 1, 2,
    2048, 0, 1, 4326,
    2054, 0, 1, 9102,
    4096, 0, 1, 3855,
  ]);
  const nodataOffset = ascii("-32767");
  const pixelOffset = cursor;
  const buffer = Buffer.alloc(pixelOffset + RASTER_BYTES);
  buffer.write("II", 0, "ascii");
  buffer.writeUInt16LE(42, 2);
  buffer.writeUInt32LE(ifdOffset, 4);
  buffer.writeUInt16LE(entryCount, ifdOffset);

  const entries = [
    [256, 4, 1, WIDTH],
    [257, 4, 1, HEIGHT],
    [258, 3, 1, 32],
    [259, 3, 1, 1],
    [273, 4, 1, pixelOffset],
    [277, 3, 1, 1],
    [278, 4, 1, HEIGHT],
    [279, 4, 1, RASTER_BYTES],
    [339, 3, 1, 3],
    [33550, 12, 3, scaleOffset],
    [33922, 12, 6, tiepointOffset],
    [34735, 3, 24, geoKeys],
    [42113, 2, 8, nodataOffset],
  ];

  for (let index = 0; index < entries.length; index += 1) {
    const [tag, type, count, value] = entries[index];
    const offset = ifdOffset + 2 + index * 12;
    buffer.writeUInt16LE(tag, offset);
    buffer.writeUInt16LE(type, offset + 2);
    buffer.writeUInt32LE(count, offset + 4);
    if (type === 3 && count === 1) buffer.writeUInt16LE(value, offset + 8);
    else if (type === 4 && count === 1) buffer.writeUInt32LE(value, offset + 8);
    else buffer.writeUInt32LE(value, offset + 8);
  }
  for (const item of external) item.buffer.copy(buffer, item.offset);

  const writePixel = (row, col, value) => buffer.writeFloatLE(value, pixelOffset + (row * WIDTH + col) * 4);
  writePixel(0, 0, 101.5);
  writePixel(1800, 1800, 202.25);
  writePixel(3600, 3600, 303.75);
  writePixel(100, 100, -32767);
  return buffer;
}

const bytes = makeDemFixture();
const manifest = {
  schemaVersion: 1,
  dataset: "COP-DEM_GLO-30-DGED",
  release: "2024_1",
  tiles: [{
    id: "N40_E030",
    path: "N40_E030.tif",
    sha256: "a".repeat(64),
    semantic: {
      width: 3601,
      height: 3601,
      horizontalCrs: "EPSG:4326",
      verticalCrs: "EPSG:3855",
      rasterType: "RasterPixelIsPoint",
      gridSpacingArcSeconds: 1,
      nodata: -32767,
      bounds: { west: 30, south: 40, east: 31, north: 41 },
    },
  }],
};

let loads = 0;
const sampler = createWgs84ElevationSampler({
  manifest,
  tileLoader: async () => {
    loads += 1;
    return bytes;
  },
});

assert.equal(await sampler.sample(30, 41), 101.5);
assert.equal(await sampler.sample(30.5, 40.5), 202.25);
assert.equal(await sampler.sample(31, 40), 303.75);
assert.equal(await sampler.sample(30 + 100 / 3600, 41 - 100 / 3600), null);
assert.equal(loads, 1, "tile bytes must be cached after the first validated load");

assert.throws(
  () => createWgs84ElevationSampler({ manifest: { ...manifest, tiles: [] }, tileLoader: async () => bytes }),
  /contains no DEM tiles/,
);
assert.throws(
  () => createWgs84ElevationSampler({
    manifest: { ...manifest, tiles: [{ ...manifest.tiles[0], semantic: { ...manifest.tiles[0].semantic, rasterType: "RasterPixelIsArea" } }] },
    tileLoader: async () => bytes,
  }),
  /validated GLO-30 DEM semantics/,
);

console.log("P6.2-A.2 WGS84 elevation sampler: PASS");
console.log("mapping=lon/lat -> nearest RasterPixelIsPoint post");
console.log("nodata=declared or non-finite -> null");
console.log("cache=validated tile bytes");
