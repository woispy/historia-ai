const MAGIC = 0x484D4150;
const VERSION = 1;
const HEADER_BYTES = 64;
const PROVINCE_FIELD_COUNT = 8;
const TILE_STRIDE = 6;
const LOD_STRIDE = 4;
const CITY_STRIDE = 6;

const HEADER = Object.freeze({ magic:0, version:4, flags:6, provinceCount:8, tileCount:12, geometryPointCount:16, lodRangeCount:20, cityCount:24, provinceOffset:28, tileOffset:32, geometryOffset:36, lodOffset:40, cityOffset:44, paletteOffset:48, paletteByteLength:52, totalByteLength:56 });

/** Immutable zero-copy view over a versioned .mapbin ArrayBuffer. */
export class BinaryMapAssetSource {
  constructor(buffer){
    if(!(buffer instanceof ArrayBuffer))throw new TypeError("BinaryMapAssetSource requires an ArrayBuffer");
    if(buffer.byteLength<HEADER_BYTES)throw new RangeError("Invalid mapbin: truncated header");
    this.buffer=buffer;this.header=readHeader(buffer);validateHeader(this.header,buffer.byteLength);
    const p=this.header.provinceOffset,n=this.header.provinceCount;
    this.ids=new Uint32Array(buffer,p,n);this.owner=new Uint32Array(buffer,p+n*4,n);this.minX=new Float32Array(buffer,p+n*8,n);this.minY=new Float32Array(buffer,p+n*12,n);this.maxX=new Float32Array(buffer,p+n*16,n);this.maxY=new Float32Array(buffer,p+n*20,n);this.centerX=new Float32Array(buffer,p+n*24,n);this.centerY=new Float32Array(buffer,p+n*28,n);
    this.tileIndex=new Uint32Array(buffer,this.header.tileOffset,this.header.tileCount*TILE_STRIDE);this.geometry=new Float32Array(buffer,this.header.geometryOffset,this.header.geometryPointCount*2);this.lodRanges=new Uint32Array(buffer,this.header.lodOffset,this.header.lodRangeCount*LOD_STRIDE);this.cityBlocks=new Float32Array(buffer,this.header.cityOffset,this.header.cityCount*CITY_STRIDE);this.palette=new Uint8Array(buffer,this.header.paletteOffset,this.header.paletteByteLength);
    this.idToIndex=new Map();for(let i=0;i<n;i+=1)this.idToIndex.set(String(this.ids[i]),i);Object.freeze(this.header);
  }
  static fromArrayBuffer(buffer){return new BinaryMapAssetSource(buffer);}
  get provinceCount(){return this.header.provinceCount;}get tileCount(){return this.header.tileCount;}get geometryPointCount(){return this.header.geometryPointCount;}
  getProvinceId(index){return this.ids[index]??0;}
  getProvinceGeometryRange(index,lod=0){if(index<0||index>=this.provinceCount)return null;const base=this.ids.length>index?this.header.lodOffset+index*LOD_STRIDE*4:0;const selected=base?new DataView(this.buffer,base,LOD_STRIDE*4).getUint32(lod*4,true):0;if(selected>=this.header.lodRangeCount)return null;const b=selected*LOD_STRIDE;return{pointOffset:this.lodRanges[b],pointCount:this.lodRanges[b+1]};}
  geometryView(pointOffset,pointCount){if(pointOffset<0||pointCount<0||pointOffset+pointCount>this.geometryPointCount)throw new RangeError("Geometry range out of bounds");return new Float32Array(this.buffer,this.header.geometryOffset+pointOffset*8,pointCount*2);}
  tileRecord(index){if(index<0||index>=this.tileCount)return null;return this.tileIndex.subarray(index*TILE_STRIDE,index*TILE_STRIDE+TILE_STRIDE);}
  lodRecord(index){if(index<0||index>=this.header.lodRangeCount)return null;return this.lodRanges.subarray(index*LOD_STRIDE,index*LOD_STRIDE+LOD_STRIDE);}
  cityRecord(index){if(index<0||index>=this.header.cityCount)return null;return this.cityBlocks.subarray(index*CITY_STRIDE,index*CITY_STRIDE+CITY_STRIDE);}
  indexOf(id){return this.idToIndex.get(String(id))??-1;}
}

function readHeader(b){const v=new DataView(b);return{magic:v.getUint32(0,true),version:v.getUint16(4,true),flags:v.getUint16(6,true),provinceCount:v.getUint32(8,true),tileCount:v.getUint32(12,true),geometryPointCount:v.getUint32(16,true),lodRangeCount:v.getUint32(20,true),cityCount:v.getUint32(24,true),provinceOffset:v.getUint32(28,true),tileOffset:v.getUint32(32,true),geometryOffset:v.getUint32(36,true),lodOffset:v.getUint32(40,true),cityOffset:v.getUint32(44,true),paletteOffset:v.getUint32(48,true),paletteByteLength:v.getUint32(52,true),totalByteLength:v.getUint32(56,true)};}
function validateHeader(h,bytes){if(h.magic!==MAGIC)throw new Error("Invalid mapbin magic");if(h.version!==VERSION)throw new Error(`Unsupported mapbin version: ${h.version}`);if(h.totalByteLength!==bytes)throw new Error("Invalid mapbin length");const provinceEnd=h.provinceOffset+h.provinceCount*PROVINCE_FIELD_COUNT*4,tileEnd=h.tileOffset+h.tileCount*TILE_STRIDE*4,geometryEnd=h.geometryOffset+h.geometryPointCount*8,lodEnd=h.lodOffset+h.lodRangeCount*LOD_STRIDE*4,cityEnd=h.cityOffset+h.cityCount*CITY_STRIDE*4,paletteEnd=h.paletteOffset+h.paletteByteLength;const offsets=[h.provinceOffset,h.tileOffset,h.geometryOffset,h.lodOffset,h.cityOffset,h.paletteOffset];if(offsets.some((o)=>o<HEADER_BYTES||o%4!==0||o>bytes)||provinceEnd>h.tileOffset||tileEnd>h.geometryOffset||geometryEnd>h.lodOffset||lodEnd>h.cityOffset||cityEnd>h.paletteOffset||paletteEnd!==bytes)throw new Error("Invalid mapbin section offsets");}
export const MAPBIN_LAYOUT=Object.freeze({MAGIC,VERSION,HEADER_BYTES,PROVINCE_FIELD_COUNT,TILE_STRIDE,LOD_STRIDE,CITY_STRIDE});
export default BinaryMapAssetSource;
