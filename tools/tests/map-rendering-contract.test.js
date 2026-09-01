import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const root=resolve(import.meta.dirname,"../..");
const read=(p)=>readFileSync(resolve(root,p),"utf8").replace(/\r\n/g,"\n");
const worldMap=read("src/map/components/WorldMap.jsx"),mapView=read("src/components/GameShell/MapView/MapView.jsx"),mapViewCss=read("src/components/GameShell/MapView/MapView.css"),renderer=read("src/map/rendering/gpu/BinaryMapRenderer.js"),host=read("src/map/rendering/MapEngineV2.jsx"),source=read("src/map/runtime/BinaryMapAssetSource.js");
assert.equal((worldMap.match(/<MapEngineV2\b/g)??[]).length,1);assert.ok(!worldMap.includes("SvgRenderer"));assert.ok(!worldMap.includes("ProvinceTextureLayer"));assert.ok(!worldMap.includes("ProvinceLayer"));assert.ok(!worldMap.includes("CityLayer"));
for(const token of ["country-layer","city-layer","army-layer","effect-layer"]){assert.ok(!mapView.includes(token));assert.ok(!mapViewCss.includes(`.${token}`));}
assert.match(renderer,/getContext\("webgl2"/);assert.match(renderer,/bufferData\(gl\.ARRAY_BUFFER,assetSource\.geometry/);assert.match(renderer,/drawArrays\(gl\.TRIANGLE_FAN/);assert.match(renderer,/readPixels\(0,0,1,1/);assert.match(renderer,/new Uint8Array\(4\)/);assert.match(renderer,/preserveDrawingBuffer:false/);
assert.match(source,/class BinaryMapAssetSource/);assert.match(source,/new Uint32Array\(buffer,p,n\)/);assert.match(source,/new Float32Array\(buffer,this.header.geometryOffset/);
assert.match(host,/BinaryMapAssetSource/);assert.match(host,/BinaryMapRenderer/);assert.doesNotMatch(host,/MapAssetBridge/);assert.doesNotMatch(host,/GpuMapRenderer/);assert.doesNotMatch(host,/onPointerMove/);
console.log("Map rendering contract passed: one Canvas surface, binary geometry input, direct GPU vertex buffer and persistent 1x1 picking target.");
