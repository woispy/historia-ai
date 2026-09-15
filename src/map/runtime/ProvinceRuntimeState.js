/**
 * Historia AI — P7 Province Runtime State
 *
 * Unified runtime state combining:
 *  - BinaryMapAssetSource (static geometry authority)
 *  - ProvinceSoA (geometry metadata + id mapping)
 *  - DynamicProvinceState (owner/controller/occupation)
 *
 * This is the single source of truth for runtime province queries.
 * Static geometry comes from the immutable mapbin; dynamic state
 * is mutatable and tracked for GPU upload.
 */

import { BinaryMapAssetSource } from "./BinaryMapAssetSource.js";
import { ProvinceSoA } from "./ProvinceSoA.js";
import { DynamicProvinceState } from "./DynamicProvinceState.js";
import { assertStaticGeometryUnchanged, captureStaticGeometryChecksum } from "./RuntimeStateIntegrity.js";

export class ProvinceRuntimeState {
  constructor(assetSource, provinceSoA, dynamicState) {
    if (!(assetSource instanceof BinaryMapAssetSource)) throw new TypeError("assetSource must be BinaryMapAssetSource");
    if (!(provinceSoA instanceof ProvinceSoA)) throw new TypeError("provinceSoA must be ProvinceSoA");
    if (!(dynamicState instanceof DynamicProvinceState)) {
      throw new TypeError("dynamicState must be DynamicProvinceState");
    }
    this.assetSource = assetSource;
    this.provinceSoA = provinceSoA;
    this.dynamicState = dynamicState;
    this.gpuBuffers = null; // { owner, controller, occupation } GPU buffers
    this.gpuDirty = false;
  }

  static async fromMapbin(buffer) {
    const assetSource = BinaryMapAssetSource.fromArrayBuffer(buffer);
    const provinceSoA = ProvinceSoA.fromBinary(buffer, assetSource.header);
    const dynamicState = DynamicProvinceState.fromMapbinOwner(assetSource.owner);
    return new ProvinceRuntimeState(assetSource, provinceSoA, dynamicState);
  }

  /** Total province count. */
  get count() { return this.assetSource.provinceCount; }

  // --- Static geometry queries (immutable) ---

  getProvinceId(index) { return this.assetSource.getProvinceId(index); }
  getProvinceIdByIndex(index) { return this.assetSource.ids[index]; }
  getProvinceIndex(provinceId) { return this.assetSource.indexOf(provinceId); }
  fillBounds(index, out) { return this.provinceSoA.fillBounds(index, out); }
  getGeometryView(pointOffset, pointCount) { return this.assetSource.geometryView(pointOffset, pointCount); }
  tileRecord(index) { return this.assetSource.tileRecord(index); }
  lodRecord(index) { return this.assetSource.lodRecord(index); }

  // --- Dynamic state queries (mutable) ---

  getOwner(index) { return this.dynamicState.owner[index]; }
  getController(index) { return this.dynamicState.controller[index]; }
  getOccupation(index) { return this.dynamicState.occupation[index]; }

  getState(index) { return this.dynamicState.get(index); }
  getAllStates() { return this.dynamicState.getAll(); }

  // --- Dynamic state mutation (fail-closed) ---

  setOwner(index, value) {
    this.dynamicState.setOwner(index, value);
    return this;
  }

  setController(index, value) {
    this.dynamicState.setController(index, value);
    return this;
  }

  setOccupation(index, value) {
    this.dynamicState.setOccupation(index, value);
    return this;
  }

  setState(index, { owner, controller, occupation }) {
    if (owner !== undefined) this.dynamicState.setOwner(index, owner);
    if (controller !== undefined) this.dynamicState.setController(index, controller);
    if (occupation !== undefined) this.dynamicState.setOccupation(index, occupation);
    return this;
  }

  /** Batch set multiple provinces. */
  setStates(indices, { owner, controller, occupation }) {
    for (const index of indices) {
      if (owner !== undefined) this.dynamicState.setOwner(index, owner);
      if (controller !== undefined) this.dynamicState.setController(index, controller);
      if (occupation !== undefined) this.dynamicState.setOccupation(index, occupation);
    }
    return this;
  }

  /** Set all states from arrays. */
  setAllStates({ owner, controller, occupation }) {
    this.dynamicState.setAll({ owner, controller, occupation });
    return this;
  }

  // --- GPU buffer management ---

  /** Create or update GPU buffers for dynamic state. */
  ensureGpuBuffers(device) {
    if (this.gpuBuffers && this.gpuBuffers.owner) return this.gpuBuffers;

    const count = this.count;
    const byteLength = this.count * 4; // per field

    this.gpuBuffers = {
      owner: this._createGpuBuffer(device, this.dynamicState.owner),
      controller: this._createGpuBuffer(device, this.dynamicState.controller),
      occupation: this._createGpuBuffer(device, this.dynamicState.occupation),
    };
    return this.gpuBuffers;
  }

  _createGpuBuffer(device, array) {
    const GPU_BUFFER_USAGE_STORAGE = 0x0100;
    const GPU_BUFFER_USAGE_COPY_DST = 0x0002;
    const buffer = device?.createBuffer({
      size: array.byteLength,
      usage: GPU_BUFFER_USAGE_STORAGE | GPU_BUFFER_USAGE_COPY_DST,
    });
    if (!buffer) return null;
    device.queue.writeBuffer(buffer, 0, array);
    return buffer;
  }

  /** Upload dirty dynamic state to GPU. */
  uploadDirtyState(device) {
    if (!this.gpuBuffers) this.ensureGpuBuffers(device);
    const dirtyIndices = this.dynamicState.getDirtyIndices();
    if (dirtyIndices.length === 0) return;

    // For simplicity, upload full buffers (could optimize to sub-ranges)
    device.queue.writeBuffer(this.gpuBuffers.owner, 0, this.dynamicState.owner);
    device.queue.writeBuffer(this.gpuBuffers.controller, 0, this.dynamicState.controller);
    device.queue.writeBuffer(this.gpuBuffers.occupation, 0, this.dynamicState.occupation);

    this.dynamicState.markClean(this.dynamicState.getDirtyIndices());
    return dirtyIndices.length;
  }

  uploadAllState(device) {
    this.ensureGpuBuffers(device);
    device.queue.writeBuffer(this.gpuBuffers.owner, 0, this.dynamicState.owner);
    device.queue.writeBuffer(this.gpuBuffers.controller, 0, this.dynamicState.controller);
    device.queue.writeBuffer(this.gpuBuffers.occupation, 0, this.dynamicState.occupation);
    this.dynamicState.markAllClean();
  }

  getGpuBuffers() { return this.gpuBuffers; }

  // --- Integrity ---

  /** Verify dynamic state integrity. */
  validateIntegrity() {
    if (!this.dynamicState.validateIntegrity()) return false;
    return true;
  }

  // --- Queries ---

  indexOf(provinceId) { return this.assetSource.indexOf(provinceId); }
  getProvinceIdByIndex(index) { return this.assetSource.ids[index]; }
}

export default ProvinceRuntimeState;