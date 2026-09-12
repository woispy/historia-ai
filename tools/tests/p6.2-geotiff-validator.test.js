import assert from "node:assert/strict";

import { validateCopernicusGlo30GeoTiff } from "../historical-gis/P62GeoTiffValidator.js";

function makeFixture({ horizontalCrs = 4326, verticalCrs = 3855, rasterType = 2, sampleFormat = 3, width = 3601, height = 3601, nodata = "" } = {}) {
  const entryCount = nodata ? 10 : 9;
  const ifdOffset = 8;
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
    1025, 0, 1, rasterType,
    2048, 0, 1, horizontalCrs,
    2054, 0, 1, 9102,
    4096, 0, 1, verticalCrs,
  ]);
  const nodataOffset = nodata ? ascii(nodata) : null;

  const buffer = Buffer.alloc(cursor);
  buffer.write("II", 0, "ascii");
  buffer.writeUInt16LE(42, 2);
  buffer.writeUInt32LE(ifdOffset, 4);
  buffer.writeUInt16LE(entryCount, ifdOffset);

  const entries = [
    [256, 4, 1, width],
    [257, 4, 1, height],
    [258, 3, 1, 32],
    [259, 3, 1, 1],
    [277, 3, 1, 1],
    [339, 3, 1, sampleFormat],
    [33550, 12, 3, scaleOffset],
    [33922, 12, 6, tiepointOffset],
    [34735, 3, 24, geoKeys],
  ];
  if (nodata) entries.push([42113, 2, nodata.length + 1, nodataOffset]);

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
  return buffer;
}

const valid = makeFixture({ nodata: "-32767" });
const metadata = validateCopernicusGlo30GeoTiff(valid, { tileId: "N40_E030" });
assert.equal(metadata.width, 3601);
assert.equal(metadata.height, 3601);
assert.equal(metadata.horizontalCrs, "EPSG:4326");
assert.equal(metadata.verticalCrs, "EPSG:3855");
assert.equal(metadata.rasterType, "RasterPixelIsPoint");
assert.equal(metadata.gridSpacingArcSeconds, 1);
assert.equal(metadata.nodata, -32767);
assert.deepEqual(metadata.bounds, { west: 30, south: 40, east: 31, north: 41 });

assert.throws(
  () => validateCopernicusGlo30GeoTiff(makeFixture({ horizontalCrs: 3857 }), { tileId: "N40_E030" }),
  /EPSG:4326/,
);
assert.throws(
  () => validateCopernicusGlo30GeoTiff(makeFixture({ verticalCrs: 4979 }), { tileId: "N40_E030" }),
  /EPSG:3855/,
);
assert.throws(
  () => validateCopernicusGlo30GeoTiff(makeFixture({ rasterType: 1 }), { tileId: "N40_E030" }),
  /RasterPixelIsPoint/,
);
assert.throws(
  () => validateCopernicusGlo30GeoTiff(makeFixture({ sampleFormat: 1 }), { tileId: "N40_E030" }),
  /IEEE floating-point/,
);
assert.throws(
  () => validateCopernicusGlo30GeoTiff(makeFixture({ width: 3600 }), { tileId: "N40_E030" }),
  /3601x3601/,
);
assert.throws(
  () => validateCopernicusGlo30GeoTiff(makeFixture({ nodata: "not-a-number" }), { tileId: "N40_E030" }),
  /not finite/,
);
assert.throws(
  () => validateCopernicusGlo30GeoTiff(makeFixture(), { tileId: "N41_E030" }),
  /do not match tile N41_E030/,
);

console.log("P6.2-A GeoTIFF semantic validator: PASS");
console.log("CRS=EPSG:4326");
console.log("verticalCRS=EPSG:3855");
console.log("grid=1-arc-second");
console.log("rasterType=RasterPixelIsPoint");
console.log("float32=required");
