import { ProvinceSoA, QuadtreeIndex, buildSpatialItems } from "../../runtime/index.js";
import { buildVisibilityPlan } from "../../runtime/GpuProvinceVisibility.js";

/**
 * Single province render contract shared by the compatibility WebGL2 renderer
 * and the future WebGPU backend. Geometry/state indexing is built once; each
 * frame receives a compact visibility plan and a stable ID mapping.
 */
export class GpuProvincePipeline {
  constructor(provinces = []) {
    this.setProvinces(provinces);
  }

  setProvinces(provinces = []) {
    this.soa = new ProvinceSoA(provinces);
    this.index = new QuadtreeIndex(buildSpatialItems(this.soa));
    this.provinceIds = provinces.map((entry) => entry?.province?.id ?? null);
    this.visibility = { lod: 0, indices: [], count: 0 };
  }

  update(camera, width, height) {
    this.visibility = buildVisibilityPlan(this.index, camera, width, height);
    return this.visibility;
  }

  provinceIdAtIndex(index) {
    return index >= 0 && index < this.provinceIds.length ? this.provinceIds[index] : null;
  }

  resolveRasterId(rasterId) {
    const value = Number(rasterId) >>> 0;
    return value > 0 ? this.provinceIdAtIndex(value - 1) : null;
  }

  stats() {
    return {
      provinceCount: this.soa.count,
      visibleCount: this.visibility.count,
      lod: this.visibility.lod,
    };
  }
}

export default GpuProvincePipeline;
