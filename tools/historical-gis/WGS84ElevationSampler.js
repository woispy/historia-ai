import fs from "node:fs/promises";

import { validateCopernicusGlo30GeoTiff } from "./P62GeoTiffValidator.js";

const TIFF_TYPE_SIZES = Object.freeze({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 11: 4, 12: 8 });
const TAG = Object.freeze({
  IMAGE_WIDTH: 256,
  IMAGE_LENGTH: 257,
  STRIP_OFFSETS: 273,
  ROWS_PER_STRIP: 278,
  STRIP_BYTE_COUNTS: 279,
  TILE_WIDTH: 322,
  TILE_LENGTH: 323,
  TILE_OFFSETS: 324,
  TILE_BYTE_COUNTS: 325,
});
const GRID_SPACING_DEGREES = 1 / 3600;
const EPSILON = 1e-10;

function fail(message) {
  throw new Error(`P6.2-A.2 WGS84 elevation sampler failed: ${message}`);
}

function readUInt(buffer, offset, bytes, littleEndian) {
  if (offset < 0 || offset + bytes > buffer.length) fail(`TIFF read exceeds payload at offset ${offset}.`);
  if (bytes === 1) return buffer.readUInt8(offset);
  if (bytes === 2) return littleEndian ? buffer.readUInt16LE(offset) : buffer.readUInt16BE(offset);
  if (bytes === 4) return littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
  fail(`unsupported TIFF integer width ${bytes}.`);
}

function readValues(buffer, entry, littleEndian) {
  const typeSize = TIFF_TYPE_SIZES[entry.type];
  if (!typeSize) fail(`unsupported TIFF field type ${entry.type}.`);
  const out = [];
  for (let index = 0; index < entry.count; index += 1) {
    const offset = entry.offset + index * typeSize;
    if (entry.type === 1) out.push(readUInt(buffer, offset, 1, littleEndian));
    else if (entry.type === 2) out.push(buffer.toString("ascii", offset, offset + 1));
    else if (entry.type === 3) out.push(readUInt(buffer, offset, 2, littleEndian));
    else if (entry.type === 4) out.push(readUInt(buffer, offset, 4, littleEndian));
    else if (entry.type === 5) {
      const numerator = readUInt(buffer, offset, 4, littleEndian);
      const denominator = readUInt(buffer, offset + 4, 4, littleEndian);
      if (denominator === 0) fail("TIFF rational has a zero denominator.");
      out.push(numerator / denominator);
    } else if (entry.type === 11) {
      const view = littleEndian ? buffer.readFloatLE(offset) : buffer.readFloatBE(offset);
      out.push(view);
    } else if (entry.type === 12) {
      out.push(littleEndian ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset));
    }
  }
  return out;
}

function parseTiffRaster(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) fail("tile payload must be a non-empty TIFF Buffer.");
  const marker = buffer.toString("ascii", 0, 2);
  const littleEndian = marker === "II";
  if (!littleEndian && marker !== "MM") fail("invalid TIFF byte order marker.");
  if (readUInt(buffer, 2, 2, littleEndian) !== 42) fail("only classic TIFF version 42 is supported.");

  const ifdOffset = readUInt(buffer, 4, 4, littleEndian);
  const entryCount = readUInt(buffer, ifdOffset, 2, littleEndian);
  const entries = new Map();
  const entryBase = ifdOffset + 2;
  for (let index = 0; index < entryCount; index += 1) {
    const offset = entryBase + index * 12;
    if (offset + 12 > buffer.length) fail("TIFF IFD exceeds payload.");
    const tag = readUInt(buffer, offset, 2, littleEndian);
    const type = readUInt(buffer, offset + 2, 2, littleEndian);
    const count = readUInt(buffer, offset + 4, 4, littleEndian);
    const typeSize = TIFF_TYPE_SIZES[type];
    if (!typeSize) fail(`unsupported TIFF field type ${type} for tag ${tag}.`);
    const byteLength = count * typeSize;
    const valueOffset = byteLength <= 4 ? offset + 8 : readUInt(buffer, offset + 8, 4, littleEndian);
    if (valueOffset + byteLength > buffer.length) fail(`TIFF tag ${tag} exceeds payload.`);
    entries.set(tag, { type, count, offset: valueOffset });
  }

  const values = (tag) => {
    const entry = entries.get(tag);
    return entry ? readValues(buffer, entry, littleEndian) : null;
  };

  const width = values(TAG.IMAGE_WIDTH)?.[0];
  const height = values(TAG.IMAGE_LENGTH)?.[0];
  const strips = values(TAG.STRIP_OFFSETS);
  const stripCounts = values(TAG.STRIP_BYTE_COUNTS);
  const rowsPerStrip = values(TAG.ROWS_PER_STRIP)?.[0];
  const tileWidth = values(TAG.TILE_WIDTH)?.[0];
  const tileLength = values(TAG.TILE_LENGTH)?.[0];
  const tileOffsets = values(TAG.TILE_OFFSETS);
  const tileByteCounts = values(TAG.TILE_BYTE_COUNTS);

  if (!width || !height) fail("raster dimensions are missing.");
  if (strips && stripCounts && rowsPerStrip) {
    if (strips.length !== stripCounts.length || rowsPerStrip <= 0) fail("strip layout is invalid.");
    return { buffer, littleEndian, width, height, strips, stripCounts, rowsPerStrip, tileWidth: null, tileLength: null, tileOffsets: null, tileByteCounts: null };
  }
  if (tileWidth && tileLength && tileOffsets && tileByteCounts) {
    if (tileOffsets.length !== tileByteCounts.length || tileWidth <= 0 || tileLength <= 0) fail("tile layout is invalid.");
    return { buffer, littleEndian, width, height, strips: null, stripCounts: null, rowsPerStrip: null, tileWidth, tileLength, tileOffsets, tileByteCounts };
  }
  fail("uncompressed raster has neither a complete strip layout nor a complete tile layout.");
}

function readFloat32At(raster, row, col) {
  const { buffer, littleEndian, width, height } = raster;
  if (row < 0 || row >= height || col < 0 || col >= width) fail(`pixel (${row},${col}) is outside the raster.`);

  let byteOffset;
  if (raster.strips) {
    const stripIndex = Math.floor(row / raster.rowsPerStrip);
    const rowInStrip = row - stripIndex * raster.rowsPerStrip;
    if (stripIndex >= raster.strips.length) fail(`strip index ${stripIndex} is outside the raster.`);
    byteOffset = raster.strips[stripIndex] + (rowInStrip * width + col) * 4;
    if (byteOffset + 4 > raster.strips[stripIndex] + raster.stripCounts[stripIndex]) fail("pixel read exceeds strip byte count.");
  } else {
    const tilesAcross = Math.ceil(width / raster.tileWidth);
    const tileX = Math.floor(col / raster.tileWidth);
    const tileY = Math.floor(row / raster.tileLength);
    const tileIndex = tileY * tilesAcross + tileX;
    if (tileIndex >= raster.tileOffsets.length) fail(`tile index ${tileIndex} is outside the raster.`);
    const localX = col - tileX * raster.tileWidth;
    const localY = row - tileY * raster.tileLength;
    byteOffset = raster.tileOffsets[tileIndex] + (localY * raster.tileWidth + localX) * 4;
    if (byteOffset + 4 > raster.tileOffsets[tileIndex] + raster.tileByteCounts[tileIndex]) fail("pixel read exceeds tile byte count.");
  }
  return littleEndian ? buffer.readFloatLE(byteOffset) : buffer.readFloatBE(byteOffset);
}

function canonicalTileKey(west, south) {
  return `${south},${west}`;
}

function buildTileIndex(tiles) {
  if (!Array.isArray(tiles) || tiles.length === 0) fail("promoted manifest contains no DEM tiles.");
  const index = new Map();
  for (const tile of tiles) {
    if (!tile || typeof tile !== "object") fail("manifest contains an invalid tile entry.");
    if (typeof tile.id !== "string" || typeof tile.path !== "string") fail(`manifest tile is missing id/path: ${JSON.stringify(tile)}.`);
    const semantic = tile.semantic;
    if (!semantic || semantic.width !== 3601 || semantic.height !== 3601
      || semantic.horizontalCrs !== "EPSG:4326" || semantic.verticalCrs !== "EPSG:3855"
      || semantic.rasterType !== "RasterPixelIsPoint" || semantic.gridSpacingArcSeconds !== 1) {
      fail(`manifest tile ${tile.id} does not carry validated GLO-30 DEM semantics.`);
    }
    if (typeof tile.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(tile.sha256)) fail(`manifest tile ${tile.id} has no valid SHA-256 identity.`);
    const bounds = semantic.bounds;
    if (!bounds || !Number.isFinite(bounds.west) || !Number.isFinite(bounds.south)
      || !Number.isFinite(bounds.east) || !Number.isFinite(bounds.north)) fail(`manifest tile ${tile.id} has invalid bounds.`);
    const key = canonicalTileKey(bounds.west, bounds.south);
    if (index.has(key)) fail(`manifest contains duplicate DEM tile bounds at ${key}.`);
    index.set(key, tile);
  }
  return index;
}

function selectTile(index, lon, lat) {
  const west = Math.floor(lon + EPSILON);
  const south = Math.floor(lat + EPSILON);
  const preferred = index.get(canonicalTileKey(west, south));
  if (preferred) return preferred;
  for (const tile of index.values()) {
    const { west: tileWest, south: tileSouth, east, north } = tile.semantic.bounds;
    if (lon >= tileWest - EPSILON && lon <= east + EPSILON && lat >= tileSouth - EPSILON && lat <= north + EPSILON) return tile;
  }
  fail(`no promoted DEM tile covers WGS84 coordinate (${lon},${lat}).`);
}

function nearestIndex(value) {
  return Math.floor(value + 0.5);
}

function coordinateToPixel(tile, lon, lat) {
  const { west, south, east, north } = tile.semantic.bounds;
  if (lon < west - EPSILON || lon > east + EPSILON || lat < south - EPSILON || lat > north + EPSILON) {
    fail(`coordinate (${lon},${lat}) lies outside tile ${tile.id}.`);
  }
  const col = nearestIndex((lon - west) / GRID_SPACING_DEGREES);
  const row = nearestIndex((north - lat) / GRID_SPACING_DEGREES);
  return {
    row: Math.max(0, Math.min(3600, row)),
    col: Math.max(0, Math.min(3600, col)),
  };
}

function normalizeElevation(value, nodata) {
  if (!Number.isFinite(value)) return null;
  if (nodata !== null && Object.is(value, nodata)) return null;
  return value;
}

export function createWgs84ElevationSampler({ manifest, tileLoader }) {
  const index = buildTileIndex(manifest?.tiles);
  if (typeof tileLoader !== "function") fail("tileLoader must be a function returning a TIFF Buffer.");
  const cache = new Map();

  async function loadRaster(tile) {
    if (!cache.has(tile.id)) {
      const loaded = await tileLoader(tile);
      const buffer = Buffer.isBuffer(loaded) ? loaded : Buffer.from(loaded ?? []);
      const semantic = validateCopernicusGlo30GeoTiff(buffer, { tileId: tile.id });
      if (semantic.width !== tile.semantic.width || semantic.height !== tile.semantic.height
        || semantic.nodata !== tile.semantic.nodata) fail(`loaded DEM semantics disagree with manifest for ${tile.id}.`);
      cache.set(tile.id, parseTiffRaster(buffer));
    }
    return cache.get(tile.id);
  }

  return Object.freeze({
    async sample(lon, lat) {
      if (!Number.isFinite(lon) || !Number.isFinite(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        fail(`WGS84 coordinate is invalid: (${lon},${lat}).`);
      }
      const tile = selectTile(index, lon, lat);
      const pixel = coordinateToPixel(tile, lon, lat);
      const raster = await loadRaster(tile);
      const value = readFloat32At(raster, pixel.row, pixel.col);
      return normalizeElevation(value, tile.semantic.nodata);
    },
  });
}

export async function createWgs84ElevationSamplerFromFiles({ manifest, baseDirectory = "." }) {
  return createWgs84ElevationSampler({
    manifest,
    tileLoader: async (tile) => fs.readFile(new URL(tile.path, `file://${baseDirectory.replace(/\\/g, "/")}/`)),
  });
}

export const P62_WGS84_ELEVATION_SAMPLER_CONTRACT = Object.freeze({
  horizontalCrs: "EPSG:4326",
  verticalCrs: "EPSG:3855",
  gridSpacingArcSeconds: 1,
  rasterType: "RasterPixelIsPoint",
  width: 3601,
  height: 3601,
  sampleType: "Float32",
  coordinateOrder: "(lon,lat)",
  selection: "canonical-west-south tile ownership; inclusive fallback",
  interpolation: "nearest-neighbor grid post",
  nodata: "non-finite or declared nodata => null",
});
