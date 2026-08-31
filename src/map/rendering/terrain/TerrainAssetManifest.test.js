import assert from "node:assert/strict";
import { createTerrainAssetManifest, validateTerrainAssetManifest } from "./TerrainAssetManifest.js";

const manifest = createTerrainAssetManifest({ tileId:"3/10/20", sourceId:"canonical-dem-v1", sourceUrl:"https://example.invalid/dem", attribution:"Test fixture", crs:"EPSG:4326", bounds:{minX:30,minY:37,maxX:31,maxY:38}, dimensions:{width:257,height:257}, resolution:90, assets:{heightmap:"h.r16",normal:"n.ktx2",splatRgba:"s.ktx2",splatSnow:"ss.ktx2",landMask:"l.ktx2"} });
assert.equal(validateTerrainAssetManifest(manifest), true); assert.equal(manifest.assets.heightmap, "h.r16");
assert.throws(() => createTerrainAssetManifest({ ...manifest, attribution:"" }), /attribution/);
assert.throws(() => createTerrainAssetManifest({ ...manifest, dimensions:{width:1,height:257} }), /dimensions/);
assert.throws(() => createTerrainAssetManifest({ ...manifest, assets:{...manifest.assets, landMask:""} }), /landMask/);
console.log("Phase E terrain asset manifest: PASS");
