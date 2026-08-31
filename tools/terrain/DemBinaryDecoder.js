import { assertDemBinaryPayload } from "./RealDemBinaryContract.js";

const TIFF_LITTLE_ENDIAN = 0x4949;
const TIFF_BIG_ENDIAN = 0x4d4d;
const TIFF_MAGIC = 42;
const TIFF_TYPE_SIZES = Object.freeze({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 11: 4, 12: 8 });
const TAGS = Object.freeze({ width: 256, height: 257, bits: 258, compression: 259, stripOffsets: 273, samplesPerPixel: 277, rowsPerStrip: 278, stripByteCounts: 279, sampleFormat: 339, modelPixelScale: 33550, modelTiepoint: 33922, geoKeyDirectory: 34735, nodata: 42113 });

function checkedEnd(offset, byteCount, length) {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(byteCount) || offset < 0 || byteCount < 0 || offset > length - byteCount) throw new Error("GeoTIFF field points outside the binary.");
  return offset + byteCount;
}
function readU16(view, offset, little) { return view.getUint16(offset, little); }
function readU32(view, offset, little) { return view.getUint32(offset, little); }
function readValue(view, offset, type, little) {
  if (type === 3) return view.getUint16(offset, little);
  if (type === 4) return view.getUint32(offset, little);
  if (type === 5) return view.getUint32(offset, little) / view.getUint32(offset + 4, little);
  if (type === 11) return view.getFloat32(offset, little);
  if (type === 12) return view.getFloat64(offset, little);
  throw new Error(`Unsupported GeoTIFF field type: ${type}`);
}
function readAscii(view, field) {
  if (!field || field.type !== 2) return null;
  return new TextDecoder().decode(new Uint8Array(view.buffer, field.offset, field.count)).replace(/\0+$/, "");
}
function readValues(view, field, little) {
  if (!field) return [];
  const size = TIFF_TYPE_SIZES[field.type];
  if (!size) throw new Error("Unsupported GeoTIFF field type.");
  const values = [];
  for (let i = 0; i < field.count; i += 1) values.push(readValue(view, field.offset + i * size, field.type, little));
  return values;
}

function parseGeoTiff(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 8) throw new Error("GeoTIFF binary is truncated.");
  const byteOrder = readU16(view, 0, false);
  const little = byteOrder === TIFF_LITTLE_ENDIAN;
  if (!little && byteOrder !== TIFF_BIG_ENDIAN) throw new Error("Invalid TIFF byte order.");
  if (readU16(view, 2, little) !== TIFF_MAGIC) throw new Error("Invalid TIFF magic.");
  const ifdOffset = readU32(view, 4, little);
  checkedEnd(ifdOffset, 2, view.byteLength);
  const entryCount = readU16(view, ifdOffset, little);
  checkedEnd(ifdOffset + 2, entryCount * 12, view.byteLength);
  const fields = new Map();
  for (let i = 0; i < entryCount; i += 1) {
    const offset = ifdOffset + 2 + i * 12;
    const tag = readU16(view, offset, little);
    const type = readU16(view, offset + 2, little);
    const count = readU32(view, offset + 4, little);
    const size = TIFF_TYPE_SIZES[type];
    if (!size || count < 1 || !Number.isSafeInteger(size * count)) continue;
    const byteCount = size * count;
    const valueOffset = byteCount <= 4 ? offset + 8 : readU32(view, offset + 8, little);
    checkedEnd(valueOffset, byteCount, view.byteLength);
    fields.set(tag, { type, count, offset: valueOffset });
  }
  const width = fields.get(TAGS.width); const height = fields.get(TAGS.height); const bits = fields.get(TAGS.bits);
  if (!width || !height || !bits || width.count !== 1 || height.count !== 1 || bits.count !== 1) throw new Error("GeoTIFF requires scalar width, height and bits-per-sample tags.");
  const widthValue = readValue(view, width.offset, width.type, little); const heightValue = readValue(view, height.offset, height.type, little); const bitsValue = readValue(view, bits.offset, bits.type, little);
  const samplesValue = fields.has(TAGS.samplesPerPixel) ? readValues(view, fields.get(TAGS.samplesPerPixel), little)[0] : 1;
  const sampleFormatValue = fields.has(TAGS.sampleFormat) ? readValues(view, fields.get(TAGS.sampleFormat), little)[0] : 1;
  const compressionValue = fields.has(TAGS.compression) ? readValues(view, fields.get(TAGS.compression), little)[0] : 1;
  if (samplesValue !== 1 || bitsValue !== 16 || compressionValue !== 1 || (sampleFormatValue !== 1 && sampleFormatValue !== 2)) throw new Error("Only uncompressed single-band 16-bit GeoTIFF DEM payloads are supported by the Phase E decoder.");
  const rowsPerStripValue = fields.has(TAGS.rowsPerStrip) ? readValues(view, fields.get(TAGS.rowsPerStrip), little)[0] : heightValue;
  if (!Number.isInteger(rowsPerStripValue) || rowsPerStripValue < 1) throw new Error("GeoTIFF RowsPerStrip must be a positive integer.");
  const pixelScale = readValues(view, fields.get(TAGS.modelPixelScale), little);
  const tiepoint = readValues(view, fields.get(TAGS.modelTiepoint), little);
  const nodataText = readAscii(view, fields.get(TAGS.nodata));
  const nodataValue = nodataText === null || nodataText.trim() === "" ? null : Number(nodataText.trim());
  if (nodataText !== null && !Number.isFinite(nodataValue)) throw new Error("GeoTIFF GDAL_NODATA value is invalid.");
  const geoKeys = readValues(view, fields.get(TAGS.geoKeyDirectory), little);
  return { width: widthValue, height: heightValue, sampleFormat: sampleFormatValue, little, fields, pixelScale, tiepoint, geoKeys, nodataValue };
}

function decodeRawStripPayload(view, info) {
  const offsets = info.fields.get(TAGS.stripOffsets); const counts = info.fields.get(TAGS.stripByteCounts);
  if (!offsets || !counts || offsets.count !== counts.count) throw new Error("GeoTIFF DEM requires matching strip offsets and byte counts.");
  if (offsets.type !== 4 || counts.type !== 4) throw new Error("Phase E GeoTIFF strip offsets and byte counts must use LONG fields.");
  const samples = new Float32Array(info.width * info.height); let cursor = 0;
  for (let i = 0; i < offsets.count; i += 1) {
    const offset = readValue(view, offsets.offset + i * 4, offsets.type, info.little); const byteCount = readValue(view, counts.offset + i * 4, counts.type, info.little);
    checkedEnd(offset, byteCount, view.byteLength);
    if (byteCount % 2 !== 0) throw new Error("GeoTIFF strip payload is invalid.");
    for (let position = offset; position < offset + byteCount; position += 2) {
      if (cursor >= samples.length) throw new Error("GeoTIFF contains more samples than declared.");
      samples[cursor++] = info.sampleFormat === 2 ? view.getInt16(position, info.little) : view.getUint16(position, info.little);
    }
  }
  if (cursor !== samples.length) throw new Error("GeoTIFF contains fewer samples than declared.");
  return samples;
}

export function decodeGeoTiffDem(buffer, metadata) {
  if (!(buffer instanceof ArrayBuffer)) throw new Error("DEM decoder requires an ArrayBuffer.");
  const info = parseGeoTiff(buffer); const samples = decodeRawStripPayload(new DataView(buffer), info);
  const binaryMetadata = { ...metadata, container: "GeoTIFF", byteLength: buffer.byteLength, width: info.width, height: info.height, sampleType: info.sampleFormat === 2 ? "int16" : "uint16", noDataValue: info.nodataValue ?? metadata?.noDataValue ?? null };
  const payload = assertDemBinaryPayload({ metadata: binaryMetadata, samples });
  return Object.freeze({ metadata: payload.metadata, samples, min: payload.min, max: payload.max, validSamples: payload.validSamples, georeferencing: Object.freeze({ pixelScale: info.pixelScale, tiepoint: info.tiepoint, geoKeys: info.geoKeys }) });
}
