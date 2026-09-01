import { MapRendererContract } from "../MapRendererContract.js";

const CULL_WGSL = `
struct Camera { viewProj: mat4x4<f32>, zoom: f32, _pad: vec3<f32>, };
@group(0) @binding(0) var<storage, read> tiles: array<u32>;
@group(0) @binding(1) var<storage, read> lods: array<u32>;
@group(0) @binding(2) var<storage, read> bounds: array<f32>;
@group(0) @binding(3) var<storage, read_write> indirect: array<u32>;
@group(0) @binding(4) var<uniform> camera: Camera;

fn visible(minX:f32,minY:f32,maxX:f32,maxY:f32)->bool {
  let corners=array<vec2<f32>,4>(vec2(minX,minY),vec2(maxX,minY),vec2(minX,maxY),vec2(maxX,maxY));
  for(var i=0u;i<4u;i=i+1u){let c=camera.viewProj*vec4<f32>(corners[i],0.0,1.0);if(c.x>=-c.w&&c.x<=c.w&&c.y>=-c.w&&c.y<=c.w&&c.z>=-c.w&&c.z<=c.w){return true;}}
  return false;
}
fn lodFor(index:u32)->u32 { let base=index*4u; if(camera.zoom>=64.0{return 0u;} if(camera.zoom>=16.0{return 0u;} if(camera.zoom>=4.0{return 0u;} return 0u; }
@compute @workgroup_size(64)
fn cull(@builtin(global_invocation_id) id:vec3<u32>){
 let i=id.x; if(i>=arrayLength(&indirect)/4u){return;} let t=i*6u; let p=tiles[t+2u]; let b=p*4u;
 let v=visible(bounds[b],bounds[b+1u],bounds[b+2u],bounds[b+3u]); let o=i*4u;
 indirect[o]=tiles[t]; indirect[o+1u]=select(0u,tiles[t+1u],v); indirect[o+2u]=0u; indirect[o+3u]=0u;
}
`;

const RENDER_WGSL = `
struct Camera { viewProj: mat4x4<f32> };
@group(0) @binding(0) var<uniform> camera: Camera;
@vertex fn vs(@location(0) p:vec2<f32>)->@builtin(position) vec4<f32>{return camera.viewProj*vec4<f32>(p,0.0,1.0);}
@fragment fn fs()->@location(0) vec4<f32>{return vec4<f32>(0.32,0.36,0.28,1.0);}
`;
const PICK_WGSL = `@vertex fn vs()->@builtin(position) vec4<f32>{return vec4<f32>(0.0,0.0,0.0,1.0);}@fragment fn fs()->@location(0) vec4<f32>{return vec4<f32>(0.0);}`;

export class WebGPUMapRenderer extends MapRendererContract {
 constructor(canvas){super();this.canvas=canvas;this.device=null;this.context=null;this.format=null;this.cullPipeline=null;this.renderPipeline=null;this.cullBindGroup=null;this.renderBindGroup=null;this.buffers=null;this.assetSource=null;this.destroyed=false;this.frameRequest=0;this.camera={viewProj:new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),zoom:1};this.selected=0;this.hovered=0;this.pickTexture=null;this.pickReadback=null;this.pickPending=false;this.lastPickId=null;}
 static isSupported(){return typeof navigator!=="undefined"&&Boolean(navigator.gpu);}
 async initialize({assetSource}={}){if(this.destroyed)throw new Error("Cannot initialize a disposed WebGPU renderer");if(!assetSource||!WebGPUMapRenderer.isSupported())return false;const adapter=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!adapter)return false;this.device=await adapter.requestDevice();this.context=this.canvas.getContext("webgpu");if(!this.context){this.dispose();return false;}this.format=navigator.gpu.getPreferredCanvasFormat();this.context.configure({device:this.device,format:this.format,alphaMode:"opaque"});this.assetSource=assetSource;this.buffers=this.createAssetBuffers(assetSource);this.createCullingPipeline();this.createRenderPipeline();this.createPickingResources();return true;}
 createAssetBuffers(source){const ids=this.makeBuffer(source.ids,GPUBufferUsage.STORAGE);const bd=new Float32Array(source.provinceCount*4);for(let i=0;i<source.provinceCount;i++)bd.set([source.minX[i],source.minY[i],source.maxX[i],source.maxY[i]],i*4);const bounds=this.makeBuffer(bd,GPUBufferUsage.STORAGE);const geometry=this.makeBuffer(source.geometry,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE);const tiles=this.makeBuffer(source.tileIndex,GPUBufferUsage.STORAGE);const lods=this.makeBuffer(source.lodRanges,GPUBufferUsage.STORAGE);const indirect=this.device.createBuffer({size:Math.max(16,source.tileCount*16),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.INDIRECT|GPUBufferUsage.COPY_DST});return{ids,bounds,geometry,tiles,lods,indirect};}
 makeBuffer(view,usage){const data=new Uint8Array(view.buffer,view.byteOffset,view.byteLength);const size=Math.max(4,Math.ceil(data.byteLength/4)*4);const b=this.device.createBuffer({size,usage:usage|GPUBufferUsage.COPY_DST});if(data.byteLength)this.device.queue.writeBuffer(b,0,data);return b;}
 createCullingPipeline(){const d=this.device;const module=d.createShaderModule({code:CULL_WGSL});this.buffers.camera=d.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const layout=d.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]});this.cullPipeline=d.createComputePipeline({layout:d.createPipelineLayout({bindGroupLayouts:[layout]}),compute:{module,entryPoint:"cull"}});this.cullBindGroup=d.createBindGroup({layout,entries:[{binding:0,resource:{buffer:this.buffers.tiles}},{binding:1,resource:{buffer:this.buffers.lods}},{binding:2,resource:{buffer:this.buffers.bounds}},{binding:3,resource:{buffer:this.buffers.indirect}},{binding:4,resource:{buffer:this.buffers.camera}}]});}
 createRenderPipeline(){const d=this.device;const module=d.createShaderModule({code:RENDER_WGSL});this.buffers.renderCamera=d.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.renderPipeline=d.createRenderPipeline({layout:"auto",vertex:{module,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module,entryPoint:"fs",targets:[{format:this.format}]},primitive:{topology:"triangle-list"}});this.renderBindGroup=d.createBindGroup({layout:this.renderPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.buffers.renderCamera}}]});}
 createPickingResources(){this.pickTexture=this.device.createTexture({size:{width:1,height:1},format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});this.pickReadback=this.device.createBuffer({size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});}
 setCamera(camera={}){this.camera={...this.camera,...camera};}
 setSelectedProvinceId(id){this.selected=this.assetSource?.indexOf(id)??0;}
 setHoveredProvinceId(id){this.hovered=this.assetSource?.indexOf(id)??0;}
 pick(){if(this.pickPending||!this.device)return this.lastPickId;this.pickPending=true;const e=this.device.createCommandEncoder();e.copyTextureToBuffer({texture:this.pickTexture},{buffer:this.pickReadback,bytesPerRow:256,rowsPerImage:1},{width:1,height:1,depthOrArrayLayers:1});this.device.queue.submit([e.finish()]);this.device.queue.onSubmittedWorkDone().then(()=>this.pickReadback.mapAsync(GPUMapMode.READ)).then(()=>{const b=new Uint8Array(this.pickReadback.getMappedRange());this.lastPickId=b[0]|(b[1]<<8)|(b[2]<<16)|(b[3]<<24);this.pickReadback.unmap();this.pickPending=false;}).catch(()=>{this.pickPending=false;});return this.lastPickId;}
 resize(w,h){const dpr=Math.min(globalThis.devicePixelRatio||1,2);this.canvas.width=Math.max(1,Math.round(Number(w)*dpr));this.canvas.height=Math.max(1,Math.round(Number(h)*dpr));}
 render(){if(this.destroyed||!this.device||!this.cullBindGroup)return;const m=this.camera.viewProj instanceof Float32Array&&this.camera.viewProj.length===16?this.camera.viewProj:new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);this.device.queue.writeBuffer(this.buffers.camera,0,new Float32Array([...m,Number(this.camera.zoom)||1,0,0,0]));this.device.queue.writeBuffer(this.buffers.renderCamera,0,m);const e=this.device.createCommandEncoder();const cp=e.beginComputePass();cp.setPipeline(this.cullPipeline);cp.setBindGroup(0,this.cullBindGroup);cp.dispatchWorkgroups(Math.ceil(this.assetSource.tileCount/64));cp.end();const rp=e.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});rp.setPipeline(this.renderPipeline);rp.setBindGroup(0,this.renderBindGroup);rp.setVertexBuffer(0,this.buffers.geometry);rp.drawIndirect(this.buffers.indirect,0);rp.end();this.device.queue.submit([e.finish()]);}
 start(){if(this.destroyed||this.frameRequest)return;const loop=()=>{if(this.destroyed){this.frameRequest=0;return;}this.render();this.frameRequest=requestAnimationFrame(loop);};this.frameRequest=requestAnimationFrame(loop);}
 stop(){if(this.frameRequest)cancelAnimationFrame(this.frameRequest);this.frameRequest=0;}
 dispose(){if(this.destroyed)return;this.destroyed=true;this.stop();for(const b of Object.values(this.buffers||{}))b?.destroy?.();this.pickTexture?.destroy?.();this.pickReadback?.destroy?.();this.buffers=null;this.cullBindGroup=null;this.renderBindGroup=null;this.cullPipeline=null;this.renderPipeline=null;this.device?.destroy?.();this.device=null;this.context=null;this.assetSource=null;}
}
export {CULL_WGSL,RENDER_WGSL,PICK_WGSL};
export default WebGPUMapRenderer;
