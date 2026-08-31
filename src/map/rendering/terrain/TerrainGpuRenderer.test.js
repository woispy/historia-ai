import assert from "node:assert/strict";
import { TerrainGpuRenderer } from "./TerrainGpuRenderer.js";

const calls = { draws: [], buffers: 0 };
const fakeGl = { VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,ELEMENT_ARRAY_BUFFER:6,STATIC_DRAW:7,FLOAT:8,TEXTURE_2D:9,RGBA8:10,RGBA:11,UNSIGNED_BYTE:12,TEXTURE_MIN_FILTER:13,TEXTURE_MAG_FILTER:14,LINEAR_MIPMAP_LINEAR:15,LINEAR:16,TEXTURE_WRAP_S:17,TEXTURE_WRAP_T:18,CLAMP_TO_EDGE:19,TEXTURE0:20,TRIANGLES:21,UNSIGNED_INT:22,createShader:()=>({}),shaderSource:()=>{},compileShader:()=>{},getShaderParameter:()=>true,getShaderInfoLog:()=>"",createProgram:()=>({}),attachShader:()=>{},linkProgram:()=>{},getProgramParameter:()=>true,getProgramInfoLog:()=>"",deleteShader:()=>{},deleteProgram:()=>{},createVertexArray:()=>({}),createBuffer:()=>({}),createTexture:()=>({}),getUniformLocation:(_p,n)=>n,bindVertexArray:()=>{},bindBuffer:()=>{},bufferData:()=>{calls.buffers += 1;},enableVertexAttribArray:()=>{},vertexAttribPointer:()=>{},activeTexture:()=>{},bindTexture:()=>{},texParameteri:()=>{},texImage2D:()=>{},generateMipmap:()=>{},useProgram:()=>{},uniformMatrix4fv:()=>{},uniform4fv:()=>{},uniform1f:()=>{},uniform3fv:()=>{},uniform1i:()=>{},drawElements:(_m,count)=>calls.draws.push(count),deleteTexture:()=>{},deleteBuffer:()=>{},deleteVertexArray:()=>{} };
const renderer = new TerrainGpuRenderer(fakeGl);
renderer.uploadMesh({ positions: new Float32Array(9), normals: new Float32Array(9), uvs: new Float32Array(6), indices: new Uint32Array([0,1,2]) });
renderer.uploadSeamIndices({ north: new Uint32Array([0,1,2,2,3,0]) });
const triangles = renderer.draw({ viewProjection: new Float32Array(16), seamModes: { north: "neighbor-finer" } });
assert.equal(triangles, 3);
assert.deepEqual(calls.draws, [3,6]);
assert.ok(calls.buffers >= 5);
renderer.dispose();
console.log("Phase E terrain GPU seam renderer: PASS");
