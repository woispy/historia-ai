import { inflateSync, inflateRawSync } from "node:zlib";

const TYPE_SIZES = Object.freeze({
  1: 1, // BYTE
  2: 1, // ASCII
  3: 2, // SHORT
  4: 4, // LONG
  5: 8, // RATIONAL
  6: 1, // SBYTE
  7: 1, // UNDEFINED
  8: 2, // SSHORT
  9: 4, // SLONG
  10: 8, // SRATIONAL
  11: 4, // FLOAT
  12: 8, // DOUBLE
});

export function decodeCopernicusGeoTiff(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const littleEndian = readByteOrder(view);
  const firstIfd = readOffset(view, 4, littleEndian);
  const tags = readIfd(view, firstIfd, littleEndian);

  const width = numberTag(tags, 256);
  const height = numberTag(tags, 257);
  const bitsPerSample = numberTag(tags, 258, 32);
  const compression = numberTag(tags, 259, 1);
  const samplesPerPixel = numberTag(tags, 277, 1);
  const sampleFormat = numberTag(tags, 339, 3);
  const predictor = numberTag(tags, 317, 1);
  const planarConfiguration = numberTag(tags, 284, 1);
  const tileWidth = numberTag(tags, 322, 0);
  const tileLength = numberTag(tags, 323, 0);
  const rowsPerStrip = numberTag(tags, 278, height);
  const nodata = asciiTag(tags, 42113);
  const pixelScale = numericArrayTag(tags, 33550);
  const tiepoint = numericArrayTag(tags, 33922);

  if (!width || !height) throw new Error("GeoTIFF is missing image dimensions.");
  if (bitsPerSample !== 32 || sampleFormat !== 3 || samplesPerPixel !== 1) {
    throw new Error(`Unsupported Copernicus DEM sample layout: bits=${bitsPerSample}, format=${sampleFormat}, samples=${samplesPerPixel}.`);
  }
  if (planarConfiguration !== 1) throw new Error("Planar GeoTIFF configuration is not supported.");
  if (![1, 8, 32946].includes(compression)) throw new Error(`Unsupported GeoTIFF compression: ${compression}.`);
  if (![1, 3].includes(predictor)) throw new Error(`Unsupported GeoTIFF predictor: ${predictor}.`);

  const blockOffsets = numericArrayTag(tags, tileWidth ? 324 : 273);
  const blockByteCounts = numericArrayTag(tags, tileWidth ? 325 : 279);
  if (!blockOffsets.length || blockOffsets.length !== blockByteCounts.length) {
    throw new Error("GeoTIFF block offsets/counts are missing or inconsistent.");
  }

  const data = new Float32Array(width * height);
  data.fill(Number.isFinite(Number(nodata)) ? Number(nodata) : 0);

  if (tileWidth) {
    const rows = Math.ceil(height / tileLength);
    const cols = Math.ceil(width / tileWidth);
    if (blockOffsets.length < rows * cols) throw new Error("GeoTIFF tile index is incomplete.");
    for (let ty = 0; ty < rows; ty += 1) {
      for (let tx = 0; tx < cols; tx += 1) {
        const block = decodeBlock(bytes, view, blockOffsets[ty * cols + tx], blockByteCounts[ty * cols + tx], compression, predictor, tileWidth, tileLength, littleEndian);
        copyBlock(data, width, height, block, tileWidth, tileLength, tx * tileWidth, ty * tileLength);
      }
    }
  } else {
    const strips = Math.ceil(height / rowsPerStrip);
    if (blockOffsets.length < strips) throw new Error("GeoTIFF strip index is incomplete.");
    for (let strip = 0; strip < strips; strip += 1) {
      const rows = Math.min(rowsPerStrip, height - strip * rowsPerStrip);
      const block = decodeBlock(bytes, view, blockOffsets[strip], blockByteCounts[strip], compression, predictor, width, rows, littleEndian);
      copyBlock(data, width, height, block, width, rows, 0, strip * rowsPerStrip);
    }
  }

  const scaleX = Number(pixelScale[0] ?? 1);
  const scaleY = Number(pixelScale[1] ?? 1);
  const originX = Number(tiepoint[3] ?? 0);
  const originY = Number(tiepoint[4] ?? 0);

  return Object.freeze({
    width,
    height,
    data,
    nodata: Number.isFinite(Number(nodata)) ? Number(nodata) : null,
    georeference: Object.freeze({ originX, originY, scaleX, scaleY }),
  });
}

function decodeBlock(bytes, view, offset, byteCount, compression, predictor, width, height, littleEndian) {
  const start = Number(offset);
  const end = start + Number(byteCount);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end > bytes.byteLength) throw new Error("GeoTIFF block points outside the file.");
  const compressed = bytes.subarray(start, end);
  let decoded;
  if (compression === 1) decoded = compressed;
  else {
    try { decoded = inflateSync(compressed); }
    catch { decoded = inflateRawSync(compressed); }
  }
  const expected = width * height * 4;
  if (decoded.byteLength < expected) throw new Error(`GeoTIFF block decoded to ${decoded.byteLength} bytes; expected at least ${expected}.`);
  const rowBytes = width * 4;
  const output = new Uint8Array(expected);
  for (let y = 0; y < height; y += 1) {
    const src = decoded.subarray(y * rowBytes, (y + 1) * rowBytes);
    const dst = output.subarray(y * rowBytes, (y + 1) * rowBytes);
    if (predictor === 1) dst.set(src);
    else undoFloatingPredictor(src, dst, width);
  }
  const floats = new Float32Array(width * height);
  const floatView = new DataView(output.buffer, output.byteOffset, output.byteLength);
  for (let i = 0; i < floats.length; i += 1) floats[i] = floatView.getFloat32(i * 4, littleEndian);
  return floats;
}

function undoFloatingPredictor(src, dst, width) {
  const planeSize = width;
  if (src.length !== width * 4) throw new Error("Invalid floating-point predictor row.");
  const planes = new Uint8Array(src);
  for (let plane = 0; plane < 4; plane += 1) {
    let previous = 0;
    const base = plane * planeSize;
    for (let x = 0; x < width; x += 1) {
      const index = base + x;
      previous = (previous + planes[index]) & 0xff;
      planes[index] = previous;
    }
  }
  for (let x = 0; x < width; x += 1) for (let plane = 0; plane < 4; plane += 1) dst[x * 4 + plane] = planes[plane * planeSize + x];
}

function copyBlock(target, imageWidth, imageHeight, block, blockWidth, blockHeight, dstX, dstY) {
  for (let y = 0; y < blockHeight; y += 1) {
    const targetY = dstY + y;
    if (targetY >= imageHeight) break;
    const copyWidth = Math.min(blockWidth, imageWidth - dstX);
    if (copyWidth <= 0) break;
    target.set(block.subarray(y * blockWidth, y * blockWidth + copyWidth), targetY * imageWidth + dstX);
  }
}

function readByteOrder(view) {
  const marker = view.getUint16(0, false);
  if (marker === 0x4949) return true;
  if (marker === 0x4d4d) return false;
  throw new Error("Invalid TIFF byte order marker.");
}

function readOffset(view, position, littleEndian) {
  return view.getUint32(position, littleEndian);
}

function readIfd(view, offset, littleEndian) {
  const count = view.getUint16(offset, littleEndian);
  const tags = new Map();
  let cursor = offset + 2;
  for (let i = 0; i < count; i += 1) {
    const tag = view.getUint16(cursor, littleEndian);
    const type = view.getUint16(cursor + 2, littleEndian);
    const countValue = view.getUint32(cursor + 4, littleEndian);
    const byteLength = (TYPE_SIZES[type] ?? 0) * countValue;
    if (!byteLength) throw new Error(`Unsupported TIFF field type ${type} for tag ${tag}.`);
    const valueOffset = byteLength <= 4 ? cursor + 8 : readOffset(view, cursor + 8, littleEndian);
    tags.set(tag, { type, count: countValue, offset: valueOffset });
    cursor += 12;
  }
  return tags;
}

function numberTag(tags, tag, fallback = null) {
  const values = readTagValues(tags, tag);
  return values.length ? Number(values[0]) : fallback;
}

function numericArrayTag(tags, tag) {
  return readTagValues(tags, tag).map(Number);
}

function asciiTag(tags, tag) {
  const field = tags.get(tag);
  if (!field || field.type !== 2) return null;
  const bytes = readRawTagBytes(tags, field);
  let value = new TextDecoder().decode(bytes);
  value = value.replace(/\0+$/g, "").trim();
  return value || null;
}

function readTagValues(tags, tag) {
  const field = tags.get(tag);
  if (!field) return [];
  const { view, littleEndian } = fieldReaderContext;
  const result = [];
  for (let i = 0; i < field.count; i += 1) {
    const position = field.offset + i * TYPE_SIZES[field.type];
    switch (field.type) {
      case 1: case 7: result.push(view.getUint8(position)); break;
      case 3: result.push(view.getUint16(position, littleEndian)); break;
      case 4: result.push(view.getUint32(position, littleEndian)); break;
      case 5: result.push(view.getUint32(position, littleEndian) / view.getUint32(position + 4, littleEndian)); break;
      case 6: result.push(view.getInt8(position)); break;
      case 8: result.push(view.getInt16(position, littleEndian)); break;
      case 9: result.push(view.getInt32(position, littleEndian)); break;
      case 10: result.push(view.getInt32(position, littleEndian) / view.getInt32(position + 4, littleEndian)); break;
      case 11: result.push(view.getFloat32(position, littleEndian)); break;
      case 12: result.push(view.getFloat64(position, littleEndian)); break;
      default: throw new Error(`Unsupported TIFF field type ${field.type}.`);
    }
  }
  return result;
}

function readRawTagBytes(tags, field) {
  const { view } = fieldReaderContext;
  return new Uint8Array(view.buffer, view.byteOffset + field.offset, field.count * TYPE_SIZES[field.type]);
}

// The decoder is intentionally synchronous because the asset builder already
// processes one source tile at a time. The context is set only during parsing.
let fieldReaderContext = null;

const originalDecode = decodeCopernicusGeoTiff;
export { originalDecode as _decodeCopernicusGeoTiffInternal };

// Wrap the exported decoder so tag readers can remain compact without carrying
// DataView/endian arguments through every helper.
export function decodeCopernicusGeoTiffWithContext(buffer) {
  return originalDecodeWithContext(buffer);
}

function originalDecodeWithContext(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const littleEndian = readByteOrder(view);
  fieldReaderContext = { view, littleEndian };
  try { return originalDecode(buffer); }
  finally { fieldReaderContext = null; }
}
