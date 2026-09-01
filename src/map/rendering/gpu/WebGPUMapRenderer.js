import { MapRendererContract } from "../MapRendererContract.js";

const ID_SCALE = 1 / 255;
const ID_CLEAR = "vec4<f32>(0.0,0.0,0.0,0.0)";

const CULL_WGSL = `
struct Camera { viewProj: mat4x4<f32>, zoom: f32, _pad: vec3<f32> };
@group(0) @binding(0) var<storage, read> tiles: array<u32>;
@group(0) @binding(1) var<storage, read> lods: array<u32>;
@group(0) @binding(2) var<storage, read> bounds: array<f32>;
@group(0) @binding(3) var<storage, read_write> indices: array<u32>;
@group(0) @binding(4) var<storage, read_write> indexProvinceIds: array<u32>;
@group(0) @binding(5) var<storage, read_write> counter: atomic<u32>;

fn visible(minX:f32,minY:f32,maxX:f32,maxY:f32)->bool {
  let corners=array<vec2<f32>,4>(vec2(minX,minY),vec2(maxX,minY),vec2(minX,maxY),vec2(maxX,maxY));
  for(var j=0u;j<4u;j=j+1u){
    let c=camera.viewProj*vec4<f32>(corners[j],0.0,1.0);
    if(c.x>=-c.w&&c.x<=c.w&&c.y>=-c.w&&c.y<=c.w&&c.z>=-c.w&&c.z<=c.w){return true;}
  }
  return false;
}

fn lodRange(province:u32)->vec2<u32>{
  let b=province*4u;
  let start=lods[b];
  let count=lods[b+1u];
  return vec2(start,count);
}

@compute @workgroup_size(64)
fn cull(@builtin(global_invocation_id) id:vec3<u32>) {
  let tileIndex=id.x;
  if(tileIndex>=arrayLength(&tiles)/6u){return;}
  let t=tileIndex*6u;
  let province=tiles[t+2u];
  let b=province*4u;
  if(!visible(bounds[b],bounds[b+1u],bounds[b+2u],bounds[b+3u])){return;}
  let range=lodRange(province);
  if(tileIndex<range.x||tileIndex>=range.x+range.y){return;}
  let pointOffset=tiles[t];
  let pointCount=tiles[t+1u];
  if(pointCount<3u){return;}
  for(var k=1u;k+1u<pointCount;k=k+1u){
    let dst=atomicAdd(&counter,3u);
    indices[dst]=pointOffset;
    indices[dst+1u]=pointOffset+k;
    indices[dst+2u]=pointOffset+k+1u;
    indexProvinceIds[dst]=province;
    indexProvinceIds[dst+1u]=province;
    indexProvinceIds[dst+2u]=province;
  }
}
`;

const FINALIZE_WGSL = `
@group(0) @binding(0) var<storage, read_write> counter: atomic<u32>;
@group(0) @binding(1) var<storage, read_write> indirect: array<u32>;
@compute @workgroup_size(1)
fn finalize(){
  indirect[0]=atomicLoad(&counter);
  indirect[1]=1u;
  indirect[2]=0u;
  indirect[3]=0u;
  indirect[4]=0u;
}
`;

const RENDER_WGSL = `
struct Camera { viewProj: mat4x4<f32> };
@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> indexProvinceIds: array<u32>;
@vertex fn vs(@location(0) p:vec2<f32>)->@builtin(position) vec4<f32>{return camera.viewProj*vec4<f32>(p,0.0,1.0);}
@fragment fn fs(@builtin(primitive_index) primitiveIndex:u32)->@location(0) vec4<f32>{let id=indexProvinceIds[primitiveIndex*3u];let x=f32(id);return vec4<f32>(0.18+fract(x*0.103),0.22+fract(x*0.067),0.28+fract(x*0.043),1.0);}
`;

const PICK_WGSL = `
struct Camera { viewProj: mat4x4<f32>, pickNdc: vec2<f32>, _pad: vec2<f32> };
@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> indexProvinceIds: array<u32>;
fn encode(id:u32)->vec4<f32>{return vec4<f32>(f32(id&255u),f32((id>>8u)&255u),f32((id>>16u)&255u),255.0)*${ID_SCALE};}
@vertex fn vs(@location(0) p:vec2<f32>)->@builtin(position) vec4<f32>{var c=camera.viewProj*vec4<f32>(p,0.0,1.0);c.xy=c.xy-camera.pickNdc*c.w;return c;}
@fragment fn fs(@builtin(primitive_index) primitiveIndex:u32)->@location(0) vec4<f32>{return encode(indexProvinceIds[primitiveIndex*3u]);}
`;

export class WebGPUMapRenderer extends MapRendererContract {
  constructor(canvas){super();this.canvas=canvas;this.device=null;this.context=null;this.format=null;this.adapter=null;this.cullPipeline=null;this.finalizePipeline=null;this.renderPipeline=null;this.pickPipeline=null;this.cullBindGroup=null;this.finalizeBindGroup=null;this.renderBindGroup=null;this.pickBindGroup=null;this.buffers=null;this.assetSource=null;this.destroyed=false;this.frameRequest=0;this.camera={viewProj:new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),zoom:1};this.selected=0;this.hovered=0;this.pickTexture=null;this.pickReadback=null;this.pickPending=false;this.lastPickId=null;this.__benchmarkGpuTelemetry=null;}
  static isSupported(){return typeof navigator!=="undefined"&&Boolean(navigator.gpu);}
  async initialize({assetSource}={}){if(this.destroyed)throw new Error("Cannot initialize a disposed WebGPU renderer");if(!assetSource||!WebGPUMapRenderer.isSupported())return false;const adapter=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!adapter)return false;this.adapter=adapter;const requiredFeatures=[];if(adapter.features?.has?.("timestamp-query"))requiredFeatures.push("timestamp-query");this.device=await adapter.requestDevice({requiredFeatures});this.context=this.canvas.getContext("webgpu");if(!this.context){this.dispose();return false;}this.format=navigator.gpu.getPreferredCanvasFormat();this.context.configure({device:this.device,format:this.format,alphaMode:"opaque"});this.assetSource=assetSource;this.buffers=this.createAssetBuffers(assetSource);this.createCullingPipeline();this.createFinalizePipeline();this.createRenderPipeline();this.createPickingResources();this.createPickPipeline();return true;}
  createAssetBuffers(source){const ids=this.makeBuffer(source.ids,GPUBufferUsage.STORAGE);const bd=new Float32Array(source.provinceCount*4);for(let i=0;i<source.provinceCount;i++)bd.set([source.minX[i],source.minY[i],source.maxX[i],source.maxY[i]],i*4);const bounds=this.makeBuffer(bd,GPUBufferUsage.STORAGE);const geometry=this.makeBuffer(source.geometry,GPUBufferUsage.VERTEX);const tiles=this.makeBuffer(source.tileIndex,GPUBufferUsage.STORAGE);const lods=this.makeBuffer(source.lodRanges,GPUBufferUsage.STORAGE);const maxIndices=Math.max(3,source.geometryPointCount*3);const indices=this.device.createBuffer({size:maxIndices*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.INDEX});const indexProvinceIds=this.device.createBuffer({size:maxIndices*4,usage:GPUBufferUsage.STORAGE});const counter=this.device.createBuffer({size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});const indirect=this.device.createBuffer({size:20,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.INDIRECT|GPUBufferUsage.COPY_DST});return{ids,bounds,geometry,tiles,lods,indices,indexProvinceIds,counter,indirect};}
  makeBuffer(view,usage){const data=new Uint8Array(view.buffer,view.byteOffset,view.byteLength);const size=Math.max(4,Math.ceil(data.byteLength/4)*4);const b=this.device.createBuffer({size,usage:usage|GPUBufferUsage.COPY_DST});if(data.byteLength)this.device.queue.writeBuffer(b,0,data);return b;}
  createCullingPipeline(){const d=this.device,module=d.createShaderModule({code:CULL_WGSL});this.buffers.camera=d.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const entries=[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:5,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}];const layout=d.createBindGroupLayout({entries});this.cullPipeline=d.createComputePipeline({layout:d.createPipelineLayout({bindGroupLayouts:[layout]}),compute:{module,entryPoint:"cull"}});this.cullBindGroup=d.createBindGroup({layout,entries:[{binding:0,resource:{buffer:this.buffers.tiles}},{binding:1,resource:{buffer:this.buffers.lods}},{binding:2,resource:{buffer:this.buffers.bounds}},{binding:3,resource:{buffer:this.buffers.indices}},{binding:4,resource:{buffer:this.buffers.indexProvinceIds}},{binding:5,resource:{buffer:this.buffers.counter}}]});}
  createFinalizePipeline(){const d=this.device,module=d.createShaderModule({code:FINALIZE_WGSL}),layout=d.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]});this.finalizePipeline=d.createComputePipeline({layout:d.createPipelineLayout({bindGroupLayouts:[layout]}),compute:{module,entryPoint:"finalize"}});this.finalizeBindGroup=d.createBindGroup({layout,entries:[{binding:0,resource:{buffer:this.buffers.counter}},{binding:1,resource:{buffer:this.buffers.indirect}}]});}
  createRenderPipeline(){const d=this.device,module=d.createShaderModule({code:RENDER_WGSL});this.buffers.renderCamera=d.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.renderPipeline=d.createRenderPipeline({layout:"auto",vertex:{module,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module,entryPoint:"fs",targets:[{format:this.format}]},primitive:{topology:"triangle-list"}});this.renderBindGroup=d.createBindGroup({layout:this.renderPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.buffers.renderCamera}},{binding:1,resource:{buffer:this.buffers.indexProvinceIds}}]});}
  createPickingResources(){this.pickTexture=this.device.createTexture({size:{width:1,height:1},format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});this.pickReadback=this.device.createBuffer({size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});}
  createPickPipeline(){const d=this.device,module=d.createShaderModule({code:PICK_WGSL});this.buffers.pickCamera=d.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.pickPipeline=d.createRenderPipeline({layout:"auto",vertex:{module,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module,entryPoint:"fs",targets:[{format:"rgba8unorm"}]},primitive:{topology:"triangle-list"}});this.pickBindGroup=d.createBindGroup({layout:this.pickPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.buffers.pickCamera}},{binding:1,resource:{buffer:this.buffers.indexProvinceIds}}]});}
  setCamera(camera={}){this.camera={...this.camera,...camera};}
  setSelectedProvinceId(id){this.selected=this.assetSource?.indexOf(id)??0;}
  setHoveredProvinceId(id){this.hovered=this.assetSource?.indexOf(id)??0;}
  resize(w,h){const dpr=Math.min(globalThis.devicePixelRatio||1,2);this.canvas.width=Math.max(1,Math.round(Number(w)*dpr));this.canvas.height=Math.max(1,Math.round(Number(h)*dpr));}
  render(){if(this.destroyed||!this.device||!this.cullBindGroup)return;const telemetry=this.__benchmarkGpuTelemetry?.telemetry;const recordComputePass=()=>{telemetry?.computePasses!==undefined&&(telemetry.computePasses+=1);};const recordDispatch=()=>{telemetry?.dispatchCalls!==undefined&&(telemetry.dispatchCalls+=1);};const recordRenderPass=()=>{telemetry?.renderPasses!==undefined&&(telemetry.renderPasses+=1);};const recordDraw=()=>{telemetry?.drawCalls!==undefined&&(telemetry.drawCalls+=1);};const recordSubmit=()=>{telemetry?.queueSubmits!==undefined&&(telemetry.queueSubmits+=1);};const m=this.camera.viewProj instanceof Float32Array&&this.camera.viewProj.length===16?this.camera.viewProj:new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);this.device.queue.writeBuffer(this.buffers.camera,0,new Float32Array([...m,Number(this.camera.zoom)||1,0,0,0]));this.device.queue.writeBuffer(this.buffers.renderCamera,0,m);this.device.queue.writeBuffer(this.buffers.counter,0,new Uint32Array([0]));const e=this.device.createCommandEncoder();const cp=e.beginComputePass();recordComputePass();cp.setPipeline(this.cullPipeline);cp.setBindGroup(0,this.cullBindGroup);cp.dispatchWorkgroups(Math.ceil(this.assetSource.tileCount/64));recordDispatch();cp.end();const fp=e.beginComputePass();recordComputePass();fp.setPipeline(this.finalizePipeline);fp.setBindGroup(0,this.finalizeBindGroup);fp.dispatchWorkgroups(1);recordDispatch();fp.end();const rp=e.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});recordRenderPass();rp.setPipeline(this.renderPipeline);rp.setBindGroup(0,this.renderBindGroup);rp.setVertexBuffer(0,this.buffers.geometry);rp.setIndexBuffer(this.buffers.indices,"uint32");rp.drawIndexedIndirect(this.buffers.indirect,0);recordDraw();rp.end();this.device.queue.submit([e.finish()]);recordSubmit();}
  pick(x=0,y=0){if(this.pickPending||!this.device)return this.lastPickId;const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return null;const ndcX=((Number(x)-r.left)/r.width)*2-1;const ndcY=1-((Number(y)-r.top)/r.height)*2;this.pickPending=true;const telemetry=this.__benchmarkGpuTelemetry?.telemetry;const e=this.device.createCommandEncoder();this.device.queue.writeBuffer(this.buffers.pickCamera,0,new Float32Array([...this.camera.viewProj,ndcX,ndcY,0,0]));const rp=e.beginRenderPass({colorAttachments:[{view:this.pickTexture.createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]});if(telemetry){telemetry.renderPasses+=1;telemetry.drawCalls+=1;telemetry.picking.renderPasses+=1;telemetry.picking.drawCalls+=1;}rp.setPipeline(this.pickPipeline);rp.setBindGroup(0,this.pickBindGroup);rp.setVertexBuffer(0,this.buffers.geometry);rp.setIndexBuffer(this.buffers.indices,"uint32");rp.drawIndexedIndirect(this.buffers.indirect,0);rp.end();e.copyTextureToBuffer({texture:this.pickTexture},{buffer:this.pickReadback,bytesPerRow:256,rowsPerImage:1},{width:1,height:1,depthOrArrayLayers:1});this.device.queue.submit([e.finish()]);if(telemetry){telemetry.queueSubmits+=1;telemetry.picking.queueSubmits+=1;}this.device.queue.onSubmittedWorkDone().then(()=>this.pickReadback.mapAsync(GPUMapMode.READ)).then(()=>{const b=new Uint8Array(this.pickReadback.getMappedRange());const id=(b[0]|(b[1]<<8)|(b[2]<<16))>>>0;this.lastPickId=id?this.assetSource.getProvinceId(id):null;this.pickReadback.unmap();this.pickPending=false;}).catch(()=>{this.pickPending=false;});return this.lastPickId;}
  start(){if(this.destroyed||this.frameRequest)return;const loop=()=>{if(this.destroyed){this.frameRequest=0;return;}this.render();this.frameRequest=requestAnimationFrame(loop);};this.frameRequest=requestAnimationFrame(loop);}
  stop(){if(this.frameRequest)cancelAnimationFrame(this.frameRequest);this.frameRequest=0;}
  dispose(){if(this.destroyed)return;this.destroyed=true;this.stop();for(const b of Object.values(this.buffers||{}))b?.destroy?.();this.pickTexture?.destroy?.();this.pickReadback?.destroy?.();this.buffers=null;this.cullBindGroup=null;this.finalizeBindGroup=null;this.renderBindGroup=null;this.pickBindGroup=null;this.cullPipeline=null;this.finalizePipeline=null;this.renderPipeline=null;this.pickPipeline=null;this.device?.destroy?.();this.device=null;this.context=null;this.assetSource=null;this.adapter=null;}
}

export {CULL_WGSL,FINALIZE_WGSL,RENDER_WGSL,PICK_WGSL,ID_CLEAR};
export default WebGPUMapRenderer;
