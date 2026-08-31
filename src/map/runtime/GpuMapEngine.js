import { decodeGpuProvincePack } from "../rendering/gpu/GpuProvincePackFormat.js";
import { createIndexedProvinceRenderer } from "../rendering/gpu/ProvinceGpuRendererV2.js";
import { buildVisibilityPlan } from "./GpuProvinceVisibility.js";
import { createGpuPickingFramebuffer, readProvinceId } from "../rendering/gpu/GpuProvincePicking.js";

export class GpuMapEngine {
  constructor(canvas, { fetchImpl = globalThis.fetch } = {}) {
    this.canvas = canvas;
    this.fetchImpl = fetchImpl;
    this.renderer = createIndexedProvinceRenderer(canvas);
    this.pack = null;
    this.spatialIndex = null;
    this.pickingTarget = null;
  }

  async loadPack(url) {
    if (typeof this.fetchImpl !== "function") throw new Error("GPU MapEngine requires fetch");
    const response = await this.fetchImpl(url);
    if (!response.ok) throw new Error(`Unable to load HGPU pack: ${response.status}`);
    const buffer = await response.arrayBuffer();
    this.pack = decodeGpuProvincePack(buffer);
    this.renderer.upload(this.pack);
    this.pickingTarget = createGpuPickingFramebuffer(this.renderer.gl, this.canvas.width, this.canvas.height);
    return this.pack;
  }

  render(camera = { x: 0, y: 0, zoom: 1 }) {
    if (!this.pack) return { drawCalls: 0, visible: 0, lod: 0 };
    const candidates = this.pack.provinces.filter((province) => intersects(province.bounds, camera, this.canvas.width, this.canvas.height));
    const lod = Math.max(0, Math.min(3, camera.zoom < 2.5 ? 0 : camera.zoom < 8 ? 1 : camera.zoom < 24 ? 2 : 3));
    this.renderer.setVisibleRanges(candidates.map((province) => ({ firstIndex: province.lodRanges[lod].firstIndex, indexCount: province.lodRanges[lod].indexCount })));
    const drawCalls = this.renderer.render({ camera, selectedProvinceIndex: 0xffffffff });
    return { drawCalls, visible: candidates.length, lod };
  }

  pick(x, y) { return this.pickingTarget ? readProvinceId(this.renderer.gl, this.pickingTarget, x, y) : -1; }
  resize(width, height) {
    this.canvas.width = width; this.canvas.height = height;
    if (this.pickingTarget) { this.renderer.gl.deleteFramebuffer(this.pickingTarget.framebuffer); this.renderer.gl.deleteTexture(this.pickingTarget.texture); this.pickingTarget = createGpuPickingFramebuffer(this.renderer.gl, width, height); }
  }
  dispose() { this.pickingTarget = null; this.renderer.dispose(); }
}

function intersects(bounds, camera, width, height) {
  if (!bounds) return false;
  const zoom = Math.max(0.001, Number(camera.zoom) || 1); const aspect = Math.max(0.1, width / Math.max(1, height));
  const halfW = 180 / zoom; const halfH = (90 / zoom) / aspect;
  return bounds.maxX >= camera.x - halfW && bounds.minX <= camera.x + halfW && bounds.maxY >= camera.y - halfH && bounds.minY <= camera.y + halfH;
}
