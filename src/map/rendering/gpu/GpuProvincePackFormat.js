/** Deterministic binary transport for the generated GPU province pack. */
const MAGIC = new Uint8Array([72, 71, 80, 50, 0, 0, 0, 0]);
const VERSION = 2;

function assertPack(pack) {
  if (!pack || pack.version !== VERSION) throw new Error(`Unsupported GPU province pack version: ${pack?.version}`);
  if (!(pack.vertices instanceof Float32Array) || !(pack.indices instanceof Uint32Array)) throw new Error("GPU province pack buffers must be typed arrays.");
  if (pack.indices.length % 3 !== 0) throw new Error("GPU province pack indices are not triangle aligned.");
  for (const value of pack.vertices) if (!Number.isFinite(value)) throw new Error("GPU province pack contains a non-finite vertex.");
  for (const value of pack.indices) if (value >= pack.vertices.length / 2) throw new Error(`GPU province pack index out of bounds: ${value}`);
}

function encodeJson(value) {
  return new TextEncoder().encode(JSON.stringify(value));
}

export function encodeGpuProvincePack(pack) {
  assertPack(pack);
  const provinces = encodeJson(pack.provinces);
  const tiles = encodeJson(pack.tiles);
  const headerBytes = 8 + 4 + 8 + 8 + 4 * 5;
  const vertexBytes = pack.vertices.byteLength;
  const indexBytes = pack.indices.byteLength;
  const total = headerBytes + vertexBytes + indexBytes + 4 + provinces.byteLength + 4 + tiles.byteLength;
  const output = new Uint8Array(total);
  const view = new DataView(output.buffer);
  let offset = 0;

  output.set(MAGIC, offset); offset += 8;
  view.setUint32(offset, VERSION, true); offset += 4;
  view.setFloat64(offset, Number(pack.tileSize), true); offset += 8;
  view.setFloat64(offset, Number(pack.quantization), true); offset += 8;
  view.setUint32(offset, pack.vertices.length / 2, true); offset += 4;
  view.setUint32(offset, pack.indices.length, true); offset += 4;
  view.setUint32(offset, pack.provinces.length, true); offset += 4;
  view.setUint32(offset, pack.tiles.length, true); offset += 4;
  view.setUint32(offset, provinces.length, true); offset += 4;

  output.set(new Uint8Array(pack.vertices.buffer, pack.vertices.byteOffset, pack.vertices.byteLength), offset); offset += vertexBytes;
  output.set(new Uint8Array(pack.indices.buffer, pack.indices.byteOffset, pack.indices.byteLength), offset); offset += indexBytes;
  view.setUint32(offset, provinces.length, true); offset += 4;
  output.set(provinces, offset); offset += provinces.length;
  view.setUint32(offset, tiles.length, true); offset += 4;
  output.set(tiles, offset);

  return output;
}

export { MAGIC as GPU_PROVINCE_PACK_MAGIC, VERSION as GPU_PROVINCE_PACK_VERSION };
