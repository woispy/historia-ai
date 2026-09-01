import assert from "node:assert/strict";
import { loadMapBin } from "../../src/map/runtime/MapBinLoader.js";
import { encodeMapBin } from "../build/mapbin-encoder.js";

const authoritative = [{ province:{id:77}, country:{id:3}, geometry:{polygons:[[[0,0],[2,0],[1,2]]]}}];
const buffer = encodeMapBin(authoritative);
let requested = null;
const source = await loadMapBin("/assets/world.mapbin", async (url, options) => {
  requested = { url, options };
  return { ok:true, status:200, statusText:"OK", arrayBuffer:async()=>buffer };
});
assert.deepEqual(requested, { url:"/assets/world.mapbin", options:{cache:"force-cache"} });
assert.equal(source.provinceCount, 1);
assert.equal(source.getProvinceId(0), 77);
assert.equal(source.ids.buffer, buffer);
assert.equal(source.geometry.buffer, buffer);
await assert.rejects(() => loadMapBin("/assets/missing.mapbin", async () => ({ ok:false, status:404, statusText:"Not Found" })), /404/);
console.log("MapBin loader contract passed: fetch -> ArrayBuffer -> zero-copy BinaryMapAssetSource.");
