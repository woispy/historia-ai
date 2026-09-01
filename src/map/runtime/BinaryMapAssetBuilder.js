import { MAPBIN_LAYOUT } from "./BinaryMapAssetSource.js";

const { MAGIC, VERSION, HEADER_BYTES, PROVINCE_FIELD_COUNT, TILE_STRIDE, LOD_STRIDE } = MAPBIN_LAYOUT;

/** Build-time encoder. It preserves polygon boundaries as independent triangle-fan tiles. */
export function buildMapBinFromProvinces(entries = []) {
  const n = entries.length;
  const fields = Array.from({ length: PROVINCE_FIELD_COUNT }, () => new Array(n));
  const geometry = [], tiles = [], lod = [];
  for (let i = 0; i < n; i += 1) {
    const entry = entries[i];
    fields[0][i] = numericId(entry?.province?.id, i + 1);
    fields[1][i] = numericId(entry?.country?.id, 0);
    const points = [];
    let tileStart = tiles.length / TILE_STRIDE;
    for (const polygon of entry?.geometry?.polygons ?? []) {
      if (!Array.isArray(polygon) || polygon.length < 3) continue;
      const valid = polygon.filter((p) => Number.isFinite(Number(p?.[0])) && Number.isFinite(Number(p?.[1])));
      if (valid.length < 3) continue;
      const start = geometry.length / 2;
      for (const p of valid) { geometry.push(Number(p[0]), Number(p[1])); points.push([Number(p[0]), Number(p[1])]); }
      tiles.push(start, valid.length, i, 0, 0, 0);
    }
    const b = bounds(points);
    fields[2][i] = b.minX; fields[3][i] = b.minY; fields[4][i] = b.maxX; fields[5][i] = b.maxY;
    fields[6][i] = (b.minX + b.maxX) * 0.5; fields[7][i] = (b.minY + b.maxY) * 0.5;
    lod.push(tileStart, tiles.length / TILE_STRIDE - tileStart, 0, 0);
  }
  const palette = new Uint8Array(Math.max(4, (n + 1) * 4));
  entries.forEach((e, i) => palette.set(color(e?.country?.color), (i + 1) * 4));
  return encode({ fields, geometry, tiles, lod, palette, provinceCount: n });
}

function encode({ fields, geometry, tiles, lod, palette, provinceCount }) {
  const provinceBytes = provinceCount * PROVINCE_FIELD_COUNT * 4;
  const tileBytes = tiles.length * 4, geometryBytes = geometry.length * 4, lodBytes = lod.length * 4;
  const paletteOffset = HEADER_BYTES + provinceBytes + tileBytes + geometryBytes + lodBytes;
  const total = paletteOffset + palette.byteLength;
  const buffer = new ArrayBuffer(total), view = new DataView(buffer);
  view.setUint32(0, MAGIC, true); view.setUint16(4, VERSION, true); view.setUint16(6, 0, true);
  view.setUint32(8, provinceCount, true); view.setUint32(12, tiles.length / TILE_STRIDE, true); view.setUint32(16, geometry.length / 2, true);
  view.setUint32(20, lod.length / LOD_STRIDE, true); view.setUint32(24, 0, true);
  view.setUint32(28, HEADER_BYTES, true); view.setUint32(32, HEADER_BYTES + provinceBytes, true);
  view.setUint32(36, HEADER_BYTES + provinceBytes + tileBytes, true); view.setUint32(40, HEADER_BYTES + provinceBytes + tileBytes + geometryBytes, true);
  view.setUint32(44, HEADER_BYTES + provinceBytes + tileBytes + geometryBytes + lodBytes, true); view.setUint32(48, paletteOffset, true);
  view.setUint32(52, palette.byteLength, true); view.setUint32(56, total, true);
  let offset = HEADER_BYTES;
  for (const field of fields) { const out = new Uint32Array(buffer, offset, field.length); if (field === fields[2] || field === fields[3] || field === fields[4] || field === fields[5] || field === fields[6] || field === fields[7]) { const f = new Float32Array(buffer, offset, field.length); f.set(field); } else out.set(field); offset += field.length * 4; }
  new Uint32Array(buffer, offset, tiles.length).set(tiles); offset += tileBytes;
  new Float32Array(buffer, offset, geometry.length).set(geometry); offset += geometryBytes;
  new Uint32Array(buffer, offset, lod.length).set(lod); new Uint8Array(buffer, paletteOffset, palette.byteLength).set(palette);
  return buffer;
}
function bounds(points) { if (!points.length) return {minX:0,minY:0,maxX:0,maxY:0}; let minX=points[0][0],minY=points[0][1],maxX=minX,maxY=minY; for(const [x,y] of points){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);} return {minX,minY,maxX,maxY}; }
function numericId(value,fallback){const n=Number(value);return Number.isFinite(n)&&n>=0?n>>>0:fallback;}
function color(value){const h=String(value??"6f765f").replace(/^#/,'');if(!/^[0-9a-f]{6}$/i.test(h))return[111,118,95,255];return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),255];}
export default buildMapBinFromProvinces;
