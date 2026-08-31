import assert from "node:assert/strict";
import { createTerrainGpuTileResource } from "./TerrainGpuTileResource.js";

const resource = createTerrainGpuTileResource({ tileId: "N37_E030:0:0:2", vertexBytes: 4096, indexBytes: 6144, heightBytes: 8192, normalBytes: 8192, splatBytes: 4096 });
assert.equal(resource.totalBytes, 30720);
assert.equal(resource.state, "created");
resource.beginUpload();
assert.equal(resource.state, "uploading");
resource.markResident({ backend: "test", handle: 1 });
assert.equal(resource.state, "resident");
assert.deepEqual(resource.backendHandle, { backend: "test", handle: 1 });
resource.destroy();
assert.equal(resource.state, "destroyed");
assert.equal(resource.backendHandle, null);
assert.throws(() => resource.beginUpload(), /transition/);
console.log("Phase E GPU terrain tile resource: PASS");
