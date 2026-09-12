const TIFF_TYPE_SIZES = Object.freeze({
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  12: 8,
});

const TAG = Object.freeze({
  IMAGE_WIDTH: 256,
  IMAGE_LENGTH: 257,
  BITS_PER_SAMPLE: 258,
  COMPRESSION: 259,
  SAMPLES_PER_PIXEL: 277,
  SAMPLE_FORMAT: 339,
  MODEL_PIXEL_SCALE: 33550,
  MODEL_TIEPOINT: 33922,
  GEO_KEY_DIRECTORY: 34735,
  GEO_DOUBLE_PARAMS: 34736,
  GEO_ASCII_PARAMS: 34737,
  GDAL_NODATA: 42113,
});

const GEO_KEY = Object.freeze({
  GT_MODEL_TYPE: 1024,
  GT_RASTER_TYPE: 1025,
  GEOGRAPHIC_TYPE: 2048,
  GEOG_ANGULAR_UNITS: 2054,
  VERTICAL_CRS: 4096,
});

const EXPECTED = Object.freeze({
  width: 3601,
  height: 3601,
  gridSpacingDegrees: 1 / 3600,
  horizontalCrs: 4326,
  verticalCrs: 3855,
  rasterType: 2,
  modelType: 2,
  bitsPerSample: 32,
  sampleFormat: 3,
  samplesPerPixel: 1,
});

function fail(message) {
  throw new Error(`P6.2-A GeoTIFF semantic validation failed: ${message}`);
}

function assertBuffer(value) {
  if (!Buffer.isBuffer(value)) fail("input must be a Buffer.");
  if (value.length < 8) fail("payload is shorter than the TIFF header.");
}

function readUInt(buffer, offset, bytes, littleEndian) {
  if (offset < 0 || offset + bytes > buffer.length) fail(`read exceeds payload at offset ${offset}.`);
  if (bytes === 1) return buffer.readUInt8(offset);
  if (bytes === 2) return littleEndian ? buffer.readUInt16LE(offset) : buffer.readUInt16BE(offset);
  if (bytes === 4) return littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
  fail(`unsupported unsigned integer width ${bytes}.`);
}

function readDouble(buffer, offset, littleEndian) {
  if (offset < 0 || offset + 8 > buffer.length) fail(`double read exceeds payload at offset ${offset}.`);
  return littleEndian ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset);
}

function parseTiff(buffer) {
  assertBuffer(buffer);
  const byteOrder = buffer.toString("ascii", 0, 2);
  const littleEndian = byteOrder === "II";
  if (!littleEndian && byteOrder !== "MM") fail("invalid byte order marker.");
  if (readUInt(buffer, 2, 2, littleEndian) !== 42) fail("BigTIFF or unsupported TIFF version; classic TIFF version 42 required.");

  const ifdOffset = readUInt(buffer, 4, 4, littleEndian);
  if (ifdOffset < 8 || ifdOffset >= buffer.length) fail("invalid first IFD offset.");
  const entryCount = readUInt(buffer, ifdOffset, 2, littleEndian);
  const entries = new Map();
  const entryBase = ifdOffset + 2;
  const entrySize = 12;
  if (entryBase + entryCount * entrySize + 4 > buffer.length) fail("IFD exceeds payload.");

  for (let index = 0; index < entryCount; index += 1) {
    const offset = entryBase + index * entrySize;
    const tag = readUInt(buffer, offset, 2, littleEndian);
    const type = readUInt(buffer, offset + 2, 2, littleEndian);
    const count = readUInt(buffer, offset + 4, 4, littleEndian);
    const typeSize = TIFF_TYPE_SIZES[type];
    if (!typeSize) fail(`unsupported TIFF field type ${type} for tag ${tag}.`);
    const byteLength = count * typeSize;
    const valueOffset = byteLength <= 4 ? offset + 8 : readUInt(buffer, offset + 8, 4, littleEndian);
    if (valueOffset + byteLength > buffer.length) fail(`tag ${tag} value exceeds payload.`);
    entries.set(tag, { type, count, offset: valueOffset });
  }

  const values = (tag, expectedType = null) => {
    const entry = entries.get(tag);
    if (!entry) return null;
    if (expectedType !== null && entry.type !== expectedType) fail(`tag ${tag} has type ${entry.type}; expected ${expectedType}.`);
    const out = [];
    for (let index = 0; index < entry.count; index += 1) {
      const itemOffset = entry.offset + index * TIFF_TYPE_SIZES[entry.type];
      if (entry.type === 1) out.push(readUInt(buffer, itemOffset, 1, littleEndian));
      else if (entry.type === 2) out.push(buffer.toString("ascii", itemOffset, itemOffset + 1));
      else if (entry.type === 3) out.push(readUInt(buffer, itemOffset, 2, littleEndian));
      else if (entry.type === 4) out.push(readUInt(buffer, itemOffset, 4, littleEndian));
      else if (entry.type === 5) {
        const numerator = readUInt(buffer, itemOffset, 4, littleEndian);
        const denominator = readUInt(buffer, itemOffset + 4, 4, littleEndian);
        if (denominator === 0) fail(`tag ${tag} contains a zero rational denominator.`);
        out.push(numerator / denominator);
      } else if (entry.type === 12) out.push(readDouble(buffer, itemOffset, littleEndian));
    }
    return out;
  };

  return { values };
}

function geoKeys(parsed) {
  const raw = parsed.values(TAG.GEO_KEY_DIRECTORY, 3);
  if (!raw || raw.length < 4) fail("GeoKeyDirectoryTag is missing or empty.");
  const keyCount = raw[3];
  if (raw.length !== 4 + keyCount * 4) fail("GeoKeyDirectoryTag length is inconsistent.");
  const keys = new Map();
  for (let index = 0; index < keyCount; index += 1) {
    const base = 4 + index * 4;
    const keyId = raw[base];
    const location = raw[base + 1];
    const count = raw[base + 2];
    const valueOffset = raw[base + 3];
    let value;
    if (location === 0) value = valueOffset;
    else if (location === TAG.GEO_DOUBLE_PARAMS) value = parsed.values(location, 12)?.slice(valueOffset, valueOffset + count);
    else if (location === TAG.GEO_ASCII_PARAMS) value = parsed.values(location, 2)?.slice(valueOffset, valueOffset + count).join("");
    else fail(`GeoKey ${keyId} references unsupported TIFF tag ${location}.`);
    keys.set(keyId, value);
  }
  return keys;
}

function nearlyEqual(a, b, epsilon = 1e-10) {
  return Math.abs(a - b) <= epsilon;
}

function expectedBounds(tileId) {
  const match = /^([NS])(\d{2})_([EW])(\d{3})$/.exec(tileId ?? "");
  if (!match) fail(`tile id ${tileId ?? "<missing>"} is not a canonical GLO-30 grid id.`);
  const lat = Number(match[2]) * (match[1] === "S" ? -1 : 1);
  const lon = Number(match[4]) * (match[3] === "W" ? -1 : 1);
  return { west: lon, south: lat, east: lon + 1, north: lat + 1 };
}

export function validateCopernicusGlo30GeoTiff(buffer, { tileId = null } = {}) {
  const parsed = parseTiff(buffer);
  const width = parsed.values(TAG.IMAGE_WIDTH, 4)?.[0] ?? parsed.values(TAG.IMAGE_WIDTH, 3)?.[0];
  const height = parsed.values(TAG.IMAGE_LENGTH, 4)?.[0] ?? parsed.values(TAG.IMAGE_LENGTH, 3)?.[0];
  const bits = parsed.values(TAG.BITS_PER_SAMPLE, 3);
  const compression = parsed.values(TAG.COMPRESSION, 3)?.[0];
  const samples = parsed.values(TAG.SAMPLES_PER_PIXEL, 3)?.[0];
  const sampleFormat = parsed.values(TAG.SAMPLE_FORMAT, 3);
  const scale = parsed.values(TAG.MODEL_PIXEL_SCALE, 12);
  const tiepoint = parsed.values(TAG.MODEL_TIEPOINT, 12);
  const nodataValues = parsed.values(TAG.GDAL_NODATA, 2);

  if (width !== EXPECTED.width || height !== EXPECTED.height) fail(`expected ${EXPECTED.width}x${EXPECTED.height} samples, received ${width}x${height}.`);
  if (!bits || bits.length !== 1 || bits[0] !== EXPECTED.bitsPerSample) fail("DGED raster must be a single 32-bit band.");
  if (!sampleFormat || sampleFormat.length !== 1 || sampleFormat[0] !== EXPECTED.sampleFormat) fail("DGED raster must use IEEE floating-point samples.");
  if (samples !== EXPECTED.samplesPerPixel) fail("DGED raster must contain exactly one elevation band.");
  if (compression !== 1) fail(`unsupported DGED DEM compression ${compression}; authoritative sampler requires the uncompressed source raster.`);
  if (!scale || scale.length !== 3 || !nearlyEqual(scale[0], EXPECTED.gridSpacingDegrees) || !nearlyEqual(scale[1], EXPECTED.gridSpacingDegrees) || !nearlyEqual(scale[2], 0)) fail("ModelPixelScale does not match the one-arc-second geographic grid.");
  if (!tiepoint || tiepoint.length < 6 || !nearlyEqual(tiepoint[0], 0) || !nearlyEqual(tiepoint[1], 0)) fail("ModelTiepoint must anchor the first raster point at pixel (0,0).");

  const keys = geoKeys(parsed);
  if (keys.get(GEO_KEY.GT_MODEL_TYPE) !== EXPECTED.modelType) fail("GeoTIFF model type is not Geographic.");
  if (keys.get(GEO_KEY.GT_RASTER_TYPE) !== EXPECTED.rasterType) fail("GTRasterTypeGeoKey is not RasterPixelIsPoint.");
  if (keys.get(GEO_KEY.GEOGRAPHIC_TYPE) !== EXPECTED.horizontalCrs) fail("horizontal GeoKey is not EPSG:4326.");
  if (keys.get(GEO_KEY.VERTICAL_CRS) !== EXPECTED.verticalCrs) fail("vertical GeoKey is not EPSG:3855.");
  if (keys.get(GEO_KEY.GEOG_ANGULAR_UNITS) !== 9102) fail("angular units are not decimal degrees.");

  const west = tiepoint[3];
  const north = tiepoint[4];
  const east = west + scale[0] * (width - 1);
  const south = north - scale[1] * (height - 1);
  if (!Number.isFinite(west) || !Number.isFinite(north) || !Number.isFinite(east) || !Number.isFinite(south)) fail("raster bounds are not finite.");
  if (!nearlyEqual(east - west, 1, 1e-8) || !nearlyEqual(north - south, 1, 1e-8)) fail("raster bounds are not exactly 1x1 degree.");

  if (tileId) {
    const expected = expectedBounds(tileId);
    if (!nearlyEqual(west, expected.west, 1e-8) || !nearlyEqual(south, expected.south, 1e-8)
      || !nearlyEqual(east, expected.east, 1e-8) || !nearlyEqual(north, expected.north, 1e-8)) {
      fail(`raster bounds do not match tile ${tileId}.`);
    }
  }

  let nodata = null;
  if (nodataValues) {
    const raw = nodataValues.join("").replace(/\0+$/, "").trim();
    if (!raw) fail("GDAL_NODATA metadata is present but empty.");
    nodata = Number(raw);
    if (!Number.isFinite(nodata)) fail(`GDAL_NODATA value ${raw} is not finite.`);
  }

  return Object.freeze({
    width,
    height,
    bitsPerSample: bits[0],
    sampleFormat: sampleFormat[0],
    samplesPerPixel: samples,
    compression,
    horizontalCrs: "EPSG:4326",
    verticalCrs: "EPSG:3855",
    rasterType: "RasterPixelIsPoint",
    gridSpacingArcSeconds: 1,
    bounds: Object.freeze({ west, south, east, north }),
    nodata,
  });
}

export { EXPECTED as P62_GLO30_GEOTIFF_EXPECTED };
