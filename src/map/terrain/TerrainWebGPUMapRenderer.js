/**
 * Historia AI — P9 Terrain-Aware WebGPU Map Renderer
 *
 * Extends WebGPUMapRenderer with terrain-aware rendering:
 * - Hillshade multiplicative lighting
 * - Biome-based color palette
 * - Terrain attributes per vertex (elevation, slope, hillshade, biome)
 * - Biome palette as storage buffer
 */

import { MapRendererContract } from "../MapRendererContract.js";
import { createWebGpuBenchmarkTelemetry } from "../../runtime/BenchmarkGpuTelemetry.js";
import { TERRAIN_CULL_WGSL, TERRAIN_FINALIZE_WGSL, TERRAIN_RENDER_WGSL, TERRAIN_PICK_WGSL, TERRAIN_BIOME_PALETTE, TERRAIN_VERTEX_STRIDE } from "./TerrainShaders.js";
import { MapBinIntegrity } from "../runtime/RuntimeStateIntegrity.js";

const ID_SCALE = 1 / 255;

export class TerrainWebGPUMapRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.device = null;
    this.context = null;
    this.format = null;
    this.adapter = null;
    this.cullPipeline = null;
    this.finalizePipeline = null;
    this.renderPipeline = null;
    this.pickPipeline = null;
    this.cullBindGroup = null;
    this.finalizeBindGroup = null;
    this.renderBindGroup = null;
    this.pickBindGroup = null;
    this.buffers = null;
    this.assetSource = null;
    this.destroyed = false;
    this.running = false;
    this.frameRequest = 0;
    this.camera = { viewProj: new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]), zoom: 1 };
    this.selected = 0;
    this.hovered = 0;
    this.pickTexture = null;
    this.pickReadback = null;
    this.pickPending = false;
    this.lastPickId = null;
    this.telemetry = null;
    this.terrainAttrs = null; // Float32Array [elevation_km, slope_norm, hillshade, biome_id] per vertex
    this.biomePalette = null; // Uint32Array
    this.terrainAttrsBuffer = null;
    this.biomePaletteBuffer = null;
  }

  static isSupported() {
    return typeof navigator !== "undefined" && Boolean(navigator.gpu);
  }

  async initialize({ assetSource, terrainAttrs = null, biomePalette = null } = {}) {
    if (this.destroyed) throw new Error("Cannot initialize a disposed WebGPU renderer");
    if (!assetSource || !TerrainWebGPUMapRenderer.isSupported()) return false;

    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) return false;
    this.adapter = adapter;
    const requiredFeatures = [];
    if (adapter.features?.has?.("timestamp-query")) requiredFeatures.push("timestamp-query");
    if (adapter.features?.has?.("primitive-index")) requiredFeatures.push("primitive-index");
    this.device = await adapter.requestDevice({ requiredFeatures });

    const { createWebGpuBenchmarkTelemetry } = await import("../../runtime/BenchmarkGpuTelemetry.js");
    this.telemetry = createWebGpuBenchmarkTelemetry(this.device);

    this.context = this.canvas.getContext("webgpu");
    if (!this.context) { this.dispose(); return false; }
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({ device: this.device, format: this.format, alphaMode: "opaque" });
    this.assetSource = assetSource;

    // Store terrain attributes
    this.terrainAttrs = terrainAttrs ?? new Float32Array(0);
    this.biomePalette = biomePalette ?? new Uint32Array([0xFF284050, 0xFFFFFFFF, 0xFFE6DCC8, 0xFF64A064, 0xFF3C823C, 0xFFB4B450, 0xFFDCC864, 0xFFC8A03C, 0xFF287828]);

    // Create buffers including terrain attributes
    this.buffers = this.createAssetBuffers(assetSource);
    this.createCullingPipeline();
    this.createFinalizePipeline();
    this.createRenderPipeline();
    this.createPickingResources();
    this.createPickPipeline();

    return true;
  }

  createAssetBuffers(source) {
    const ids = this.makeBuffer(source.ids, GPUBufferUsage.STORAGE);
    const bd = new Float32Array(source.provinceCount * 4);
    for (let i = 0; i < source.provinceCount; i++) bd.set([source.minX[i], source.minY[i], source.maxX[i], source.maxY[i]], i * 4);
    const bounds = this.makeBuffer(bd, GPUBufferUsage.STORAGE);
    const geometry = this.makeBuffer(source.geometry, GPUBufferUsage.VERTEX);
    const tiles = this.makeBuffer(source.tileIndex, GPUBufferUsage.STORAGE);
    const lods = this.makeBuffer(source.lodRanges, GPUBufferUsage.STORAGE);
    const maxIndices = Math.max(3, source.geometryPointCount * 3);
    const indices = this.device.createBuffer({ size: maxIndices * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.INDEX });
    const indexProvinceIds = this.device.createBuffer({ size: maxIndices * 4, usage: GPUBufferUsage.STORAGE });
    const counter = this.device.createBuffer({ size: 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    const indirect = this.device.createBuffer({ size: 20, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST });
    return { ids, bounds, geometry, tiles, lods, indices, indexProvinceIds, counter, indirect };
  }

  makeBuffer(view, usage) {
    const data = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    const size = Math.max(4, Math.ceil(data.byteLength / 4) * 4);
    const b = this.device.createBuffer({ size, usage: usage | GPUBufferUsage.COPY_DST });
    if (data.byteLength) this.device.queue.writeBuffer(b, 0, data);
    return b;
  }

  createCullingPipeline() {
    const d = this.device;
    const module = d.createShaderModule({ code: TERRAIN_CULL_WGSL });
    this.buffers.camera = d.createBuffer({ size: 96, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const layout = d.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
        { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
        { binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
        { binding: 6, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
      ]
    });
    this.cullPipeline = d.createComputePipeline({ layout: d.createPipelineLayout({ bindGroupLayouts: [layout] }), compute: { module, entryPoint: "cull" } });
    this.cullBindGroup = d.createBindGroup({ layout, entries: [
      { binding: 0, resource: { buffer: this.buffers.camera } },
      { binding: 1, resource: { buffer: this.buffers.tiles } },
      { binding: 2, resource: { buffer: this.buffers.lods } },
      { binding: 3, resource: { buffer: this.buffers.bounds } },
      { binding: 4, resource: { buffer: this.buffers.indices } },
      { binding: 5, resource: { buffer: this.buffers.indexProvinceIds } },
      { binding: 6, resource: { buffer: this.buffers.counter } },
    ] });
  }

  createFinalizePipeline() {
    const d = this.device;
    const module = d.createShaderModule({ code: TERRAIN_FINALIZE_WGSL });
    const layout = d.createBindGroupLayout({ entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
    ] });
    this.finalizePipeline = d.createComputePipeline({ layout: d.createPipelineLayout({ bindGroupLayouts: [layout] }), compute: { module, entryPoint: "finalize" } });
    this.finalizeBindGroup = d.createBindGroup({ layout, entries: [
      { binding: 0, resource: { buffer: this.buffers.counter } },
      { binding: 1, resource: { buffer: this.buffers.indirect } },
    ] });
  }

  createRenderPipeline() {
    const d = this.device;
    const module = d.createShaderModule({ code: TERRAIN_RENDER_WGSL });
    this.buffers.renderCamera = d.createBuffer({ size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.terrainAttrsBuffer = d.createBuffer({
      size: Math.max(4, this.terrainAttrs.byteLength),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    if (this.terrainAttrs.byteLength) this.device.queue.writeBuffer(this.terrainAttrsBuffer, 0, this.terrainAttrs);

    this.biomePaletteBuffer = d.createBuffer({
      size: Math.max(4, this.biomePalette.byteLength),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    if (this.biomePalette.byteLength) this.device.queue.writeBuffer(this.biomePaletteBuffer, 0, this.biomePalette);

    this.renderPipeline = d.createRenderPipeline({
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [
          { arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }] },
        ],
      },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [{ format: this.format }],
      },
      primitive: { topology: "triangle-list" },
    });
    this.renderBindGroup = d.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.buffers.renderCamera } },
        { binding: 1, resource: { buffer: this.buffers.indexProvinceIds } },
        { binding: 2, resource: { buffer: this.terrainAttrsBuffer } },
        { binding: 3, resource: { buffer: this.biomePaletteBuffer } },
      ],
    });
  }

  createPickingResources() {
    this.pickTexture = this.device.createTexture({ size: { width: 1, height: 1 }, format: "rgba8unorm", usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
    this.pickReadback = this.device.createBuffer({ size: 256, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
  }

  createPickPipeline() {
    const d = this.device;
    const module = d.createShaderModule({ code: TERRAIN_PICK_WGSL });
    this.buffers.pickCamera = d.createBuffer({ size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.pickPipeline = d.createRenderPipeline({
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }] }],
      },
      fragment: { module, entryPoint: "fs", targets: [{ format: "rgba8unorm" }] },
      primitive: { topology: "triangle-list" },
    });
    this.pickBindGroup = d.createBindGroup({
      layout: this.pickPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.buffers.pickCamera } },
        { binding: 1, resource: { buffer: this.buffers.indexProvinceIds } },
      ],
    });
  }

  setCamera(camera = {}) { this.camera = { ...this.camera, ...camera }; }
  setSelectedProvinceId(id) { this.selected = this.assetSource?.indexOf(id) ?? 0; }
  setHoveredProvinceId(id) { this.hovered = this.assetSource?.indexOf(id) ?? 0; }
  resize(w, h) {
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(Number(w) * dpr));
    this.canvas.height = Math.max(1, Math.round(Number(h) * dpr));
  }
  getTelemetrySnapshot() { return this.telemetry?.snapshot() ?? null; }
  async collectTelemetry() { await this.telemetry?.collect(); }
  start() { if (this.destroyed || this.running || !this.device) return; this.running = true; const tick = () => { if (this.destroyed || !this.running) { this.frameRequest = 0; return; } this.render(); void this.collectTelemetry(); this.frameRequest = requestAnimationFrame(tick); }; this.frameRequest = requestAnimationFrame(tick); }
  stop() { if (!this.running) return; this.running = false; if (this.frameRequest) cancelAnimationFrame(this.frameRequest); this.frameRequest = 0; }

  render() {
    if (this.destroyed || !this.device || !this.cullBindGroup) return;
    const m = this.camera.viewProj instanceof Float32Array && this.camera.viewProj.length === 16
      ? this.camera.viewProj
      : new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
    this.device.queue.writeBuffer(this.buffers.camera, 0, new Float32Array([...m, Number(this.camera.zoom) || 1, 0, 0, 0]));
    this.device.queue.writeBuffer(this.buffers.renderCamera, 0, m);
    this.device.queue.writeBuffer(this.buffers.counter, 0, new Uint32Array([0]));
    const timestampSlot = this.telemetry?.beginFrame() ?? -1;
    const e = this.device.createCommandEncoder();
    const timestampBegin = timestampSlot >= 0 ? (this.telemetry?.writeTimestamp(e, timestampSlot, "begin") ?? false) : false;
    const cp = e.beginComputePass();
    this.telemetry?.recordComputePass();
    cp.setPipeline(this.cullPipeline);
    cp.setBindGroup(0, this.cullBindGroup);
    cp.dispatchWorkgroups(Math.ceil(this.assetSource.tileCount / 64));
    this.telemetry?.recordDispatch();
    cp.end();
    const fp = e.beginComputePass();
    this.telemetry?.recordComputePass();
    fp.setPipeline(this.finalizePipeline);
    fp.setBindGroup(0, this.finalizeBindGroup);
    fp.dispatchWorkgroups(1);
    this.telemetry?.recordDispatch();
    fp.end();
    const timestampEnd = timestampSlot >= 0 ? (this.telemetry?.writeTimestamp(e, timestampSlot, "end") ?? false) : false;
    const timestampReady = timestampSlot >= 0 && timestampBegin && timestampEnd ? (this.telemetry?.finishFrame(e, timestampSlot) ?? false) : false;
    const rp = e.beginRenderPass({ colorAttachments: [{ view: this.context.getCurrentTexture().createView(), clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store" }] });
    this.telemetry?.recordRenderPass();
    rp.setPipeline(this.renderPipeline);
    rp.setBindGroup(0, this.renderBindGroup);
    rp.setVertexBuffer(0, this.buffers.geometry);
    rp.setIndexBuffer(this.buffers.indices, "uint32");
    rp.drawIndexedIndirect(this.buffers.indirect, 0);
    this.telemetry?.recordDraw();
    rp.end();
    this.device.queue.submit([e.finish()]);
    this.telemetry?.recordSubmit(timestampReady ? timestampSlot : -1);
  }

  pick(x = 0, y = 0) {
    if (this.pickPending || !this.device) return this.lastPickId;
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const ndcX = ((Number(x) - r.left) / r.width) * 2 - 1;
    const ndcY = 1 - ((Number(y) - r.top) / r.height) * 2;
    this.pickPending = true;
    const e = this.device.createCommandEncoder();
    this.device.queue.writeBuffer(this.buffers.pickCamera, 0, new Float32Array([...this.camera.viewProj, ndcX, ndcY, 0, 0]));
    const rp = e.beginRenderPass({ colorAttachments: [{ view: this.pickTexture.createView(), loadOp: "clear", storeOp: "store", clearValue: { r: 0, g: 0, b: 0, a: 0 } }] });
    this.telemetry?.recordRenderPass();
    this.telemetry?.recordDraw();
    this.telemetry?.recordPickingRenderPass();
    this.telemetry?.recordPickingDraw();
    rp.setPipeline(this.pickPipeline);
    rp.setBindGroup(0, this.pickBindGroup);
    rp.setVertexBuffer(0, this.buffers.geometry);
    rp.draw(3, 1, 0, 0);
    rp.end();
    e.copyTextureToBuffer({ texture: this.pickTexture }, { buffer: this.pickReadback, bytesPerRow: 256, rowsPerImage: 1 }, { width: 1, height: 1, depthOrArrayLayers: 1 });
    this.device.queue.submit([e.finish()]);
    this.telemetry?.recordSubmit(-1);
    this.telemetry?.recordPickingSubmit();
    void this.device.queue.onSubmittedWorkDone().then(() => this.pickReadback.mapAsync(GPUMapMode.READ)).then(() => {
      const bytes = new Uint8Array(this.pickReadback.getMappedRange(0, 4));
      const id = bytes[0] | (bytes[1] << 8) | (bytes[2] << 16);
      this.lastPickId = id;
      this.pickReadback.unmap();
      this.pickPending = false;
    }).catch(() => { try { this.pickReadback.unmap(); } catch {} this.pickPending = false; });
    return this.lastPickId;
  }

  dispose() {
    this.stop();
    this.telemetry?.dispose();
    for (const b of Object.values(this.buffers || {})) { b?.destroy?.(); }
    this.pickTexture?.destroy?.();
    this.pickReadback?.destroy?.();
    this.terrainAttrsBuffer?.destroy?.();
    this.biomePaletteBuffer?.destroy?.();
    this.buffers = null;
    this.cullBindGroup = null;
    this.finalizeBindGroup = null;
    this.renderBindGroup = null;
    this.pickBindGroup = null;
    this.cullPipeline = null;
    this.finalizePipeline = null;
    this.renderPipeline = null;
    this.pickPipeline = null;
    this.device?.destroy?.();
    this.device = null;
    this.context = null;
    this.adapter = null;
    this.destroyed = true;
  }
}

export { TERRAIN_BIOME_PALETTE } from "./TerrainShaders.js";