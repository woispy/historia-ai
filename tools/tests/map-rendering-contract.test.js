import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { screenToWorld, triangulatePolygon } from "../../src/map/rendering/gpu/BinaryMapRenderer.js";
const root=resolve(import.meta.dirname,"../..");
const read=(p)=>readFileSync(resolve(root,p),"utf8").replace(/\r\n/g,"\n");
const worldMap=read("src/map/components/WorldMap.jsx"),mapView=read("src/components/GameShell/MapView/MapView.jsx"),mapViewCss=read("src/components/GameShell/MapView/MapView.css"),renderer=read("src/map/rendering/gpu/BinaryMapRenderer.js"),host=read("src/map/rendering/MapEngineV2.jsx"),source=read("src/map/runtime/BinaryMapAssetSource.js"),loader=read("src/map/runtime/MapBinLoader.js");
assert.equal((worldMap.match(/<MapEngineV2\b/g)??[]).length,1);assert.ok(!worldMap.includes("SvgRenderer"));assert.ok(!worldMap.includes("ProvinceTextureLayer"));assert.ok(!worldMap.includes("ProvinceLayer"));assert.ok(!worldMap.includes("CityLayer"));
for(const token of ["country-layer","city-layer","army-layer","effect-layer"]){assert.ok(!mapView.includes(token));assert.ok(!mapViewCss.includes(`.${token}`));}
assert.match(renderer,/getContext\("webgl2"/);assert.match(renderer,/bufferData\(gl\.ARRAY_BUFFER,assetSource\.geometry/);assert.doesNotMatch(renderer,/drawArrays\(gl\.TRIANGLE_FAN/);assert.match(renderer,/drawElements\(gl\.TRIANGLES/);assert.match(renderer,/readPixels\(0,0,1,1/);assert.match(renderer,/new Uint8Array\(4\)/);assert.match(renderer,/preserveDrawingBuffer:false/);assert.match(renderer,/setHoveredProvinceId\(id\)/);
assert.match(source,/class BinaryMapAssetSource/);assert.match(source,/new Uint32Array\(buffer,p,n\)/);assert.match(source,/new Float32Array\(buffer,this.header.geometryOffset/);
assert.match(host,/loadMapBin\(assetUrl\)/);assert.match(host,/BinaryMapRenderer/);assert.doesNotMatch(host,/MapAssetBridge/);assert.doesNotMatch(host,/GpuMapRenderer/);assert.doesNotMatch(host,/onPointerMove/);assert.match(loader,/BinaryMapAssetSource\.fromArrayBuffer/);assert.match(host,/pitch:0,pitchMin:0,pitchMax:0/);assert.match(host,/yaw:0,yawMin:0,yawMax:0/);assert.match(host,/const productionCamera = \{ \.\.\.camera, pitch: 0, yaw: 0 \}/);
const concave=[[0,0],[2,0],[2,1],[1,0.25],[0,1]];const triangles=triangulatePolygon(concave);assert.equal(triangles.length,9);assert.equal(new Set(triangles).size,5);assert.equal(triangles.length/3,3);
const camera={x:29.7,y:40.5,zoom:3,pitch:24,yaw:17};const center=screenToWorld(0.5,0.5,camera);assert.ok(center);assert.ok(Math.abs(center[0]-camera.x)<1e-9);assert.ok(Math.abs(center[1]-camera.y)<1e-9);
console.log("Map rendering contract passed: production WebGL2 renderer implements the hover contract, uses real triangle-list geometry, maps picking through the active camera, and the production host locks the map to a top-down projection.");
