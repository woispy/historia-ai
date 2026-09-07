import assert from "node:assert/strict";
import { decodeCopernicusGeoTiff } from "../asset-builder/dem/GeoTiffDecoder.js";

function buildPredictor3Tiff(rows) {
  const width = rows[0].length;
  const height = rows.length;
  const entries = 11;
  const ifdOffset = 8;
  const ifdSize = 2 + entries * 12 + 4;
  const stripOffset = ifdOffset + ifdSize;
  const stripBytes = width * height * 4;
  const buffer = new ArrayBuffer(stripOffset + stripBytes);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  bytes[0] = 0x49;
  bytes[1] = 0x49;
  view.setUint16(2, 42, true);
  view.setUint32(4, ifdOffset, true);
  view.setUint16(ifdOffset, entries, true);

  let cursor = ifdOffset + 2;
  const entry = (tag, type, count, value) => {
    view.setUint16(cursor, tag, true);
    view.setUint16(cursor + 2, type, true);
    view.setUint32(cursor + 4, count, true);
    if (type === 3 && count === 1) view.setUint16(cursor + 8, value, true);
    else view.setUint32(cursor + 8, value, true);
    cursor += 12;
  };

  entry(256, 3, 1, width);
  entry(257, 3, 1, height);
  entry(258, 3, 1, 32);
  entry(259, 3, 1, 1);
  entry(262, 3, 1, 1);
  entry(273, 4, 1, stripOffset);
  entry(277, 3, 1, 1);
  entry(278, 3, 1, height);
  entry(279, 4, 1, stripBytes);
  entry(317, 3, 1, 3);
  entry(339, 3, 1, 3);
  view.setUint32(cursor, 0, true);

  const strip = new Uint8Array(buffer, stripOffset, stripBytes);
  const raw = new Uint8Array(width * 4);
  const rawView = new DataView(raw.buffer);
  let outputOffset = 0;

  for (const row of rows) {
    for (let x = 0; x < width; x += 1) rawView.setFloat32(x * 4, row[x], true);
    for (let plane = 3; plane >= 0; plane -= 1) {
      let previous = 0;
      for (let x = 0; x < width; x += 1) {
        const current = raw[x * 4 + plane];
        strip[outputOffset++] = (current - previous + 256) & 255;
        previous = current;
      }
    }
  }

  return new Uint8Array(buffer);
}

const raster = decodeCopernicusGeoTiff(buildPredictor3Tiff([
  [100.5, 101.5],
  [200.25, 201.25],
]));

assert.equal(raster.width, 2);
assert.equal(raster.height, 2);
assert.equal(raster.predictor, 3);
assert.deepEqual(Array.from(raster.data, value => Number(value.toFixed(5))), [100.5, 101.5, 200.25, 201.25]);

console.log("GeoTIFF Predictor=3 row/endianness regression test passed.");
