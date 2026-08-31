import assert from "node:assert/strict";
import { createCanonicalTerrainTileLoader } from "./TerrainCanonicalTileLoader.js";

const manifest = { tileId:"3/10/20", sourceId:"copernicus-dem", sourceUrl:"https://example.invalid/copernicus", attribution:"Fixture", crs:"EPSG:4326", bounds:{minX:30,minY:37,maxX:31,maxY:38}, dimensions:{width:3,height:3}, resolution:30, assets:{heightmap:"h",normal:"n",splatRgba:"s",splatSnow:"ss",landMask:"l"} };
const fetched = [];
const loader = createCanonicalTerrainTileLoader({ manifestForTile: async () => manifest, fetchBinary: async (path) => { fetched.push(path); return new ArrayBuffer(4); }, decodeHeightmap: async () => ({ width:3,height:3,crs:"EPSG:4326",resolutionMeters:30,bounds:manifest.bounds,spacingX:30,spacingY:30,samples:Float32Array.from([1,2,1,2,4,2,1,2,1]) }), buildTexturePayloads: async (payloads) => payloads });
const asset = await loader("3/10/20");
assert.equal(asset.mesh.positions[3], 30); assert.equal(asset.mesh.positions[6], 60); assert.equal(asset.byteLength, 20); assert.deepEqual(fetched, ["h","n","s","ss","l"]);
const broken = createCanonicalTerrainTileLoader({ manifestForTile: async () => manifest, fetchBinary: async () => new ArrayBuffer(4), decodeHeightmap: async () => ({ width:3,height:3,crs:"EPSG:3857",resolutionMeters:30,bounds:manifest.bounds,spacingX:30,spacingY:30,samples:new Float32Array(9) }) });
await assert.rejects(() => broken("3/10/20"), /CRS/);
console.log("Phase E canonical terrain tile loader: PASS");
