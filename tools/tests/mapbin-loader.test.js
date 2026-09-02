import assert from "node:assert/strict";
import { loadMapBin } from "../../src/map/runtime/MapBinLoader.js";
import { encodeMapBin } from "../build/mapbin-encoder.js";

const authoritative = [{ province:{identity:{id:77}}, country:{id:3}, geometry:{polygons:[[[0,0],[2,0],[1,2]]]}}];
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

const retracing = [
  [-156.3471221923828,71.33132970376517],
  [-156.47401428222656,71.35443878173828],
  [-156.9047393798828,71.34585528515625],
  [-157.31787109375,71.15849304199219],
  [-157.81193542480469,70.97139739990234],
  [-158.41685485839844,70.90830993652344],
  [-158.85516357421875,70.88426208496094],
  [-159.36935424804688,70.89875793457031],
  [-160.24032592773438,70.85845947265625],
  [-160.24032592773438,70.85845947265625],
  [-159.36935424804688,70.89875793457031],
  [-158.85516357421875,70.88426208496094],
  [-156.47401428222656,71.35443878173828],
  [-156.3471221923828,71.33132970376517],
  [-156.043212890625,71.22303009082031],
  [-156.043212890625,71.22303009082031],
  [-156.3471221923828,71.33132970376517],
];
const normalizedBuffer = encodeMapBin([{ province:{identity:{id:39}}, geometry:{polygons:[retracing]}}]);
const normalizedSource = await loadMapBin("/assets/world.mapbin", async () => ({ ok:true, status:200, statusText:"OK", arrayBuffer:async()=>normalizedBuffer }));
assert.ok(normalizedSource.tileCount >= 1);
assert.ok(normalizedSource.geometryPointCount <= 4);

const nearDuplicateRetracing = retracing.map(([x,y], index) => {
  if (index === 9) return [x + 1e-10, y + 1e-10];
  if (index === 10) return [x - 1e-10, y - 1e-10];
  if (index === 13) return [x + 1e-10, y + 1e-10];
  if (index === 15) return [x - 1e-10, y - 1e-10];
  if (index === 16) return [x + 1e-10, y + 1e-10];
  return [x,y];
});
const nearDuplicateBuffer = encodeMapBin([{ province:{identity:{id:40}}, geometry:{polygons:[nearDuplicateRetracing]}}]);
const nearDuplicateSource = await loadMapBin("/assets/world.mapbin", async () => ({ ok:true, status:200, statusText:"OK", arrayBuffer:async()=>nearDuplicateBuffer }));
assert.ok(nearDuplicateSource.tileCount >= 1);
assert.ok(nearDuplicateSource.geometryPointCount <= 4);

await assert.rejects(() => loadMapBin("/assets/missing.mapbin", async () => ({ ok:false, status:404, statusText:"Not Found" })), /404/);
console.log("MapBin loader contract passed: fetch -> ArrayBuffer -> zero-copy BinaryMapAssetSource, including degenerate and near-duplicate polygon normalization.");
