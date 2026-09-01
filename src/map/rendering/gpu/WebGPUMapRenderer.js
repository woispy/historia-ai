import { MapRendererContract } from "../MapRendererContract.js";

const CULL_WGSL = `
struct Camera { center: vec2<f32>, halfExtent: vec2<f32>, };
@group(0) @binding(0) var<storage, read> tiles: array<u32>;
@group(0) @binding(1) var<storage, read> lods: array<u32>;
@group(0) @binding(2) var<storage, read> bounds: array<f32>;
@group(0) @binding(3) var<storage, read_write> indirect: array<u32>;
@group(0) @binding(4) var<uniform> camera: Camera;

@compute @workgroup_size(64)
fn cull(@builtin(global_invocation_id) id: vec3<u32>) {
  let tileIndex = id.x;
  if (tileIndex >= arrayLength(&indirect) / 4u) { return; }
  let tile = tileIndex * 6u;
  let province = tiles[tile + 2u];
  let b = province * 4u;
  let minX = bounds[b]; let minY = bounds[b + 1u];
  let maxX = bounds[b + 2u]; let maxY = bounds[b + 3u];
  let visible = maxX >= camera.center.x - camera.halfExtent.x &&
                minX <= camera.center.x + camera.halfExtent.x &&
                maxY >= camera.center.y - camera.halfExtent.y &&
                minY <= camera.center.y + camera.halfExtent.y;
  let lodBase = tileIndex * 4u;
  let lodHint = lods[lodBase + 1u];
  let outBase = tileIndex * 4u;
  indirect[outBase] = tiles[tile];
  indirect[outBase + 1u] = select(0u, tiles[tile + 1u], visible && lodHint >= 0u);
  indirect[outBase + 2u] = 0u;
  indirect[outBase + 3u] = 0u;
}
`;

export class WebGPUMapRenderer extends MapRendererContract {
  constructor(canvas){
    super();this.canvas=canvas;this.device=null;this.context=null;this.format=null;this.pipeline=null;this.cullBindGroup=null;this.buffers=null;this.destroyed=false;this.frameRequest=0;this.camera={x:0,y:0,zoom:1,pitch:24,yaw:0};this.selected=0;this.hovered=0;
  }

  static isSupported(){return typeof navigator!=="undefined"&&Boolean(navigator.gpu);}

  async initialize({assetSource}={}){
    if(this.destroyed)throw new Error("Cannot initialize a disposed WebGPU renderer");
    if(!assetSource||!WebGPUMapRenderer.isSupported())return false;
    const adapter=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!adapter)return false;
    this.device=await adapter.requestDevice();this.context=this.canvas.getContext("webgpu");if(!this.context){this.dispose();return false;}
    this.format=navigator.gpu.getPreferredCanvasFormat();this.context.configure({device:this.device,format:this.format,alphaMode:"opaque"});
    this.buffers=this.createAssetBuffers(assetSource);this.createCullingPipeline(assetSource);return true;
  }

  createAssetBuffers(source){
    const d=this.device;
    const provinceIds=this.makeBuffer(source.ids, GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);
    const provinceBounds=new Float32Array(source.provinceCount*4);
    provinceBounds.set(source.minX,0); // replaced below with interleaved bounds for compute locality
    for(let i=0;i<source.provinceCount;i+=1){provinceBounds[i*4]=source.minX[i];provinceBounds[i*4+1]=source.minY[i];provinceBounds[i*4+2]=source.maxX[i];provinceBounds[i*4+3]=source.maxY[i];}
    const bounds=this.makeBuffer(provinceBounds,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);
    const geometry=this.makeBuffer(source.geometry,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);
    const tiles=this.makeBuffer(source.tileIndex,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);
    const lods=this.makeBuffer(source.lodRanges,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);
    const indirect=d.createBuffer({size:Math.max(16,source.tileCount*16),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.INDIRECT|GPUBufferUsage.COPY_DST});
    d.queue.writeBuffer(indirect,0,new Uint32Array(Math.max(4,source.tileCount*4)));
    return {provinceIds,bounds,geometry,tiles,lods,indirect};
  }

  makeBuffer(view,usage){const data=new Uint8Array(view.buffer,view.byteOffset,view.byteLength);const size=Math.max(4,Math.ceil(data.byteLength/4)*4);const buffer=this.device.createBuffer({size,usage});if(data.byteLength)this.device.queue.writeBuffer(buffer,0,data);return buffer;}

  createCullingPipeline(source){
    const d=this.device;
    const module=d.createShaderModule({code:CULL_WGSL});
    const cameraBuffer=d.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    const layout=d.createBindGroupLayout({entries:[
      {binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},
      {binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},
      {binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},
      {binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},
      {binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},
    ]});
    this.pipeline=d.createComputePipeline({layout:d.createPipelineLayout({bindGroupLayouts:[layout]}),compute:{module,entryPoint:"cull"}});
    this.cullBindGroup=d.createBindGroup({layout,entries:[
      {binding:0,resource:{buffer:this.buffers.tiles}},
      {binding:1,resource:{buffer:this.buffers.lods}},
      {binding:2,resource:{buffer:this.buffers.bounds}},
      {binding:3,resource:{buffer:this.buffers.indirect}},
      {binding:4,resource:{buffer:cameraBuffer}},
    ]});
    this.buffers.camera=cameraBuffer;this.tileCount=source.tileCount;
  }

  setCamera(camera){this.camera={...this.camera,...camera};}
  setSelectedProvinceId(id){this.selected=Number(id)>>>0;}
  setHoveredProvinceId(id){this.hovered=Number(id)>>>0;}
  pick(){return null;}
  resize(w,h){const dpr=Math.min(globalThis.devicePixelRatio||1,2);const W=Math.max(1,Math.round(Number(w)*dpr)),H=Math.max(1,Math.round(Number(h)*dpr));if(this.canvas.width!==W||this.canvas.height!==H){this.canvas.width=W;this.canvas.height=H;}}

  render(){if(this.destroyed||!this.device||!this.cullBindGroup)return;const z=Math.max(.001,Number(this.camera.zoom)||1);const half=new Float32Array([180/z,90/z]);this.device.queue.writeBuffer(this.buffers.camera,0,new Float32Array([Number(this.camera.x)||0,Number(this.camera.y)||0,half[0],half[1]]));const encoder=this.device.createCommandEncoder();const pass=encoder.beginComputePass();pass.setPipeline(this.pipeline);pass.setBindGroup(0,this.cullBindGroup);pass.dispatchWorkgroups(Math.ceil(this.tileCount/64));pass.end();this.device.queue.submit([encoder.finish()]);}
  start(){if(this.destroyed||this.frameRequest)return;const loop=()=>{if(this.destroyed){this.frameRequest=0;return;}this.render();this.frameRequest=requestAnimationFrame(loop);};this.frameRequest=requestAnimationFrame(loop);}
  stop(){if(this.frameRequest)cancelAnimationFrame(this.frameRequest);this.frameRequest=0;}
  dispose(){if(this.destroyed)return;this.destroyed=true;this.stop();for(const buffer of Object.values(this.buffers||{})){if(buffer&&typeof buffer.destroy==="function")buffer.destroy();}this.buffers=null;this.cullBindGroup=null;this.pipeline=null;this.context=null;this.device?.destroy?.();this.device=null;}
}

export { CULL_WGSL };
export default WebGPUMapRenderer;
