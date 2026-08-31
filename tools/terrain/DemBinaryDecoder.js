import { assertDemBinaryPayload } from "./RealDemBinaryContract.js";

const TIFF_LITTLE_ENDIAN = 0x4949;
const TIFF_BIG_ENDIAN = 0x4d4d;
const TIFF_MAGIC = 42;
const TIFF_TYPE_SIZES = Object.freeze({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 11: 4, 12: 8 });

function readU16(view, offset, little) { return view.getUint16(offset, little); }
function readU32(view, offset, little) { return view.getUint32(offset, little); }
function readValue(view, offset, type, little) {
  if (type === 3) return view.getUint16(offset, little);
  if (type === 4) return view.getUint32(offset, little);
  if (type === 11) return view.getFloat32(offset, little);
  if (type === 12) return view.getFloat64(offset, little);
  throw new Error(`Unsupported GeoTIFF field type: ${type}`);
}

function parseGeoTiff(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 8) throw new Error("GeoTIFF binary is truncated.");
  const byteOrder = readU16(view, 0, false);
  const little = byteOrder === TIFF_LITTLE_ENDIAN;
  if (!little && byteOrder !== TIFF_BIG_ENDIAN) throw new Error("Invalid TIFF byte order.");
  if (readU16(view, 2, little) !== TIFF_MAGIC) throw new Error("Invalid TIFF magic.");
  const ifdOffset = readU32(view, 4, little);
  if (ifdOffset + 2 > view.byteLength) throw new Error("GeoTIFF IFD offset is outside the binary.");
  const entryCount = readU16(view, ifdOffset, little);
  const fields = new Map();
  for (let i = 0; i < entryCount; i += 1) {
    const offset = ifdOffset + 2 + i * 12;
    if (offset + 12 > view.byteLength) throw new Error("GeoTIFF IFD entry is truncated.");
    const tag = readU16(view, offset, little);
    const type = readU16(view, offset + 2, little);
    const count = readU32(view, offset + 4, little);
    const size = TIFF_TYPE_SIZES[type];
    if (!size || count < 1) continue;
    const byteCount = size * count;
    const valueOffset = byteCount <= 4 ? offset + 8 : readU32(view, offset + 8, little);
    if (valueOffset + byteCount > view.byteLength) throw new Error("GeoTIFF field points outside the binary.");
    fields.set(tag, { type, count, offset: valueOffset });
  }
  const width = fields.get(256);
  const height = fields.get(257);
  const bits = fields.get(258);
  const samplesPerPixel = fields.get(277);
  const sampleFormat = fields.get(339);
  const compression = fields.get(259);
  if (!width || !height || !bits) throw new Error("GeoTIFF requires width, height and bits-per-sample tags.");
  const widthValue = readValue(view, width.offset, width.type, little);
  const heightValue = readValue(view, height.offset, height.type, little);
  const bitsValue = readValue(view, bits.offset, bits.type, little);
  const samplesValue = samplesPerPixel ? readValue(view, samplesPerPixel.offset, samplesPerPixel.type, little) : 1;
  const sampleFormatValue = sampleFormat ? readValue(view, sampleFormat.offset, sampleFormat.type, little) : 1;
  const compressionValue = compression ? readValue(view, compression.offset, compression.type, little) : 1;
  if (samplesValue !== 1 || bitsValue !== 16 || compressionValue !== 1 || (sampleFormatValue !== 1 && sampleFormatValue !== 2)) throw new Error("Only uncompressed single-band 16-bit GeoTIFF DEM payloads are supported by the Phase E decoder.");
  return { width: widthValue, height: heightValue, sampleFormat: sampleFormatValue, little, fields };
}

function decodeRawStripPayload(view, info) {
  const offsets = info.fields.get(273);
  const counts = info.fields.get(279);
  if (!offsets || !counts || offsets.count !== counts.count) throw new Error("GeoTIFF DEM requires matching strip offsets and byte counts.");
  const samples = new Float32Array(info.width * info.height);
  let cursor = 0;
  for (let i = 0; i < offsets.count; i += 1) {
    const offset = readValue(view, offsets.offset + i * 4, offsets.type, info.little);
    const byteCount = readValue(view, counts.offset + i * 4, counts.type, info.little);
    if (offset < 0 || byteCount < 0 || offset + byteCount > view.byteLength || byteCount % 2 !== 0) throw new Error("GeoTIFF strip payload is invalid.");
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
  const info = parseGeoTiff(buffer);
  const samples = decodeRawStripPayload(new DataView(buffer), info);
  const binaryMetadata = { ...metadata, container: "GeoTIFF", byteLength: buffer.byteLength, width: info.width, height: info.height, sampleType: info.sampleFormat === 2 ? "int16" : "uint16" };
  const payload = assertDemBinaryPayload({ metadata: binaryMetadata, samples });
  return Object.freeze({ metadata: payload.metadata, samples, min: payload.min, max: payload.max, validSamples: payload.validSamples });
}
