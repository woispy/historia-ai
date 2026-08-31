import { COMPUTE_CULL_SHADER, createProvinceMetaBufferData, INDIRECT_COMMAND_BYTES } from "./WebGPUProvincePipeline.js";

const USAGE = typeof GPUBufferUsage === "undefined" ? { STORAGE:128, COPY_DST:8, VERTEX:32, INDEX:16, INDIRECT:256, UNIFORM:64 } : GPUBufferUsage;
const RENDER_WGSL = `
struct Camera { center:vec2<f32>, halfExtent:vec2<f32>, zoom:f32, _pad:vec3<f32> };
@group(0) @binding(0) var<uniform> camera:Camera;
struct VSOut { @builtin(position) position:vec4<f32>, @location(0) province:u32 };
@vertex fn vs(@location(0) position:vec2<f32>, @builtin(instance_index) instance:u32)->VSOut { var out:VSOut; let p=(position-camera.center)/camera.halfExtent; out.position=vec4<f32>(p.x,-p.y,0.0,1.0); out.province=instance; return out; }
@fragment fn fs(@location(0) province:u32)->@location(0) vec4<f32> { let k=f32(province%17u)/16.0; return vec4<f32>(0.20+k*0.35,0.32+k*0.25,0.22+k*0.20,1.0); }
`;

export async function createWebGPUProvinceRenderer(canvas, pack) {
  if (!navigator.gpu) return null;
  const adapter=await navigator.gpu.requestAdapter(); if(!adapter)return null; const device=await adapter.requestDevice();
  const context=canvas.getContext("webgpu"); if(!context)return null; const format=navigator.gpu.getPreferredCanvasFormat(); context.configure({device,format,alphaMode:"premultiplied"});
  const vertices=device.createBuffer({size:align4(pack.vertices.byteLength),usage:USAGE.VERTEX|USAGE.COPY_DST});
  const indices=device.createBuffer({size:align4(pack.indices.byteLength),usage:USAGE.INDEX|USAGE.COPY_DST});
  const metaData=createProvinceMetaBufferData(pack); const metadata=device.createBuffer({size:align4(metaData.byteLength),usage:USAGE.STORAGE|USAGE.COPY_DST});
  const commands=device.createBuffer({size:align4(pack.provinces.length*INDIRECT_COMMAND_BYTES),usage:USAGE.STORAGE|USAGE.INDIRECT|USAGE.COPY_DST});
  const camera=device.createBuffer({size:32,usage:USAGE.UNIFORM|USAGE.COPY_DST});
  device.queue.writeBuffer(vertices,0,pack.vertices); device.queue.writeBuffer(indices,0,pack.indices); device.queue.writeBuffer(metadata,0,metaData);
  const cullModule=device.createShaderModule({code:COMPUTE_CULL_SHADER}); const computePipeline=device.createComputePipeline({layout:"auto",compute:{module:cullModule,entryPoint:"main"}});
  const computeBind=device.createBindGroup({layout:computePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:metadata}},{binding:1,resource:{buffer:commands}},{binding:2,resource:{buffer:camera}}]});
  const renderModule=device.createShaderModule({code:RENDER_WGSL}); const renderPipeline=device.createRenderPipeline({layout:"auto",vertex:{module:renderModule,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:renderModule,entryPoint:"fs",targets:[{format}]},primitive:{topology:"triangle-list",cullMode:"none"}});
  return { device,context,buffers:{vertices,indices,metadata,commands,camera}, render({centerX=0,centerY=0,halfWidth=180,halfHeight=90,zoom=1}={}) { const cameraData=new Float32Array([centerX,centerY,halfWidth,halfHeight,zoom,0,0,0]); device.queue.writeBuffer(camera,0,cameraData); const encoder=device.createCommandEncoder(); const cp=encoder.beginComputePass(); cp.setPipeline(computePipeline); cp.setBindGroup(0,computeBind); cp.dispatchWorkgroups(Math.ceil(pack.provinces.length/64)); cp.end(); const rp=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]}); rp.setPipeline(renderPipeline); rp.setVertexBuffer(0,vertices); rp.setIndexBuffer(indices,"uint32"); for(let i=0;i<pack.provinces.length;i+=1) rp.drawIndexedIndirect(commands,i*INDIRECT_COMMAND_BYTES); rp.end(); device.queue.submit([encoder.finish()]); }, destroy(){vertices.destroy();indices.destroy();metadata.destroy();commands.destroy();camera.destroy();device.destroy();} };
}
function align4(size){return Math.max(4,(Number(size)+3)&~3);}
