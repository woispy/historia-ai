const MAGIC = 0x484D4150;
const VERSION = 1;
const HEADER_BYTES = 64;
const PROVINCE_FIELDS = 8;
const TILE_STRIDE = 6;
const LOD_STRIDE = 4;

export function encodeMapBin(entries = []) {
  const n = entries.length;
  const ids = new Uint32Array(n), owner = new Uint32Array(n);
  const minX = new Float32Array(n), minY = new Float32Array(n), maxX = new Float32Array(n), maxY = new Float32Array(n);
  const centerX = new Float32Array(n), centerY = new Float32Array(n);
  const geometry = [], tiles = [], lod = [];

  for (let i = 0; i < n; i += 1) {
    const entry = entries[i];
    ids[i] = numericId(entry?.identity?.id ?? entry?.province?.id, i + 1);
    owner[i] = numericId(entry?.identity?.ownerId ?? entry?.country?.id, 0);
    const provinceTilesStart = tiles.length / TILE_STRIDE;
    const points = [];
    for (const polygon of entry?.polygons ?? entry?.geometry?.polygons ?? []) {
      if (!Array.isArray(polygon) || polygon.length < 3) continue;
      const valid = polygon.filter((p) => Number.isFinite(Number(p?.[0])) && Number.isFinite(Number(p?.[1])));
      if (valid.length < 3) continue;
      const pointOffset = geometry.length / 2;
      for (const p of valid) { const x=Number(p[0]), y=Number(p[1]); geometry.push(x,y); points.push([x,y]); }
      tiles.push(pointOffset, valid.length, i, 0, 0, 0);
    }
    const b = bounds(points);
    minX[i]=b.minX; minY[i]=b.minY; maxX[i]=b.maxX; maxY[i]=b.maxY;
    centerX[i]=(b.minX+b.maxX)*0.5; centerY[i]=(b.minY+b.maxY)*0.5;
    lod.push(provinceTilesStart, tiles.length / TILE_STRIDE - provinceTilesStart, 0, 0);
  }

  const palette = new Uint8Array(Math.max(4,(n+1)*4));
  entries.forEach((entry,i)=>palette.set(color(entry?.identity?.color ?? entry?.country?.color),(i+1)*4));
  return pack({ids,owner,minX,minY,maxX,maxY,centerX,centerY,tiles,geometry,lod,palette});
}

export function inspectMapBin(buffer) {
  const v = new DataView(buffer);
  return { magic:v.getUint32(0,true), version:v.getUint16(4,true), provinceCount:v.getUint32(8,true), tileCount:v.getUint32(12,true), geometryPointCount:v.getUint32(16,true), lodRangeCount:v.getUint32(20,true), cityCount:v.getUint32(24,true), provinceOffset:v.getUint32(28,true), tileOffset:v.getUint32(32,true), geometryOffset:v.getUint32(36,true), lodOffset:v.getUint32(40,true), cityOffset:v.getUint32(44,true), paletteOffset:v.getUint32(48,true), paletteByteLength:v.getUint32(52,true), totalByteLength:v.getUint32(56,true) };
}

function pack(d){
  const n=d.ids.length, provinceBytes=n*PROVINCE_FIELDS*4, tileBytes=d.tiles.length*4, geometryBytes=d.geometry.length*4, lodBytes=d.lod.length*4;
  const paletteOffset=HEADER_BYTES+provinceBytes+tileBytes+geometryBytes+lodBytes,total=paletteOffset+d.palette.byteLength;
  const b=new ArrayBuffer(total),v=new DataView(b);
  v.setUint32(0,MAGIC,true);v.setUint16(4,VERSION,true);v.setUint32(8,n,true);v.setUint32(12,d.tiles.length/TILE_STRIDE,true);v.setUint32(16,d.geometry.length/2,true);v.setUint32(20,d.lod.length/LOD_STRIDE,true);v.setUint32(28,HEADER_BYTES,true);v.setUint32(32,HEADER_BYTES+provinceBytes,true);v.setUint32(36,HEADER_BYTES+provinceBytes+tileBytes,true);v.setUint32(40,HEADER_BYTES+provinceBytes+tileBytes+geometryBytes,true);v.setUint32(44,HEADER_BYTES+provinceBytes+tileBytes+geometryBytes+lodBytes,true);v.setUint32(48,paletteOffset,true);v.setUint32(52,d.palette.byteLength,true);v.setUint32(56,total,true);
  let o=HEADER_BYTES;for(const f of[d.ids,d.owner,d.minX,d.minY,d.maxX,d.maxY,d.centerX,d.centerY]){new Uint8Array(b,o,f.byteLength).set(new Uint8Array(f.buffer,f.byteOffset,f.byteLength));o+=f.byteLength;}new Uint32Array(b,o,d.tiles.length).set(d.tiles);o+=tileBytes;new Float32Array(b,o,d.geometry.length).set(d.geometry);o+=geometryBytes;new Uint32Array(b,o,d.lod.length).set(d.lod);new Uint8Array(b,paletteOffset,d.palette.byteLength).set(d.palette);return b;
}
function bounds(points){if(!points.length)return{minX:0,minY:0,maxX:0,maxY:0};let minX=points[0][0],minY=points[0][1],maxX=minX,maxY=minY;for(const[x,y]of points){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}return{minX,minY,maxX,maxY};}
function numericId(value,fallback){const n=Number(value);return Number.isFinite(n)&&n>=0?n>>>0:fallback;}
function color(value){const h=String(value??"6f765f").replace(/^#/,'');if(!/^[0-9a-f]{6}$/i.test(h))return[111,118,95,255];return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),255];}
