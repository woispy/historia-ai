/**
 * Historia AI — P7 GPU Dynamic State Uploader
 *
 * Per-frame GPU upload manager for dynamic province state (owner/controller/
 * occupation). Bridges ProvinceRuntimeState's DynamicProvinceState dirty
 * tracking to GPU storage buffers:
 *
 *  - Creates one GPU storage buffer per state field at attach time.
 *  - uploadDirty(device) each frame: writes ONLY when there are dirty
 *    provinces (clean frames are no-ops), then clears the dirty marks.
 *  - Static geometry authority is never touched: this uploader only ever
 *    writes the three dedicated state buffers.
 *
 * The device interface is minimal (createBuffer + queue.writeBuffer) so the
 * uploader is testable in Node with a mock device.
 */

import { assertStaticGeometryUnchanged, captureStaticGeometryChecksum } from "./RuntimeStateIntegrity.js";

const GPU_BUFFER_USAGE_STORAGE = 0x0100;
const GPU_BUFFER_USAGE_COPY_DST = 0x0002;

export class DynamicStateUploader {
  constructor(provinceRuntimeState) {
    if (!provinceRuntimeState?.dynamicState) throw new TypeError("ProvinceRuntimeState with dynamicState is required");
    this.runtimeState = provinceRuntimeState;
    this.dynamicState = provinceRuntimeState.dynamicState;
    this.buffers = null; // { owner, controller, occupation }
    this.frame = 0;
    this.totalUploads = 0;
    this.staticGeometryChecksum = null;
  }

  /**
   * Attach to a device: create the three state buffers and perform the
   * initial full upload. Also snapshots the static geometry checksum so
   * integrity can be verified after any batch of uploads.
   */
  attach(device, { bufferHeader = null } = {}) {
    if (!device?.createBuffer || !device?.queue?.writeBuffer) throw new TypeError("device must expose createBuffer and queue.writeBuffer");
    if (this.buffers) return this.buffers;
    const make = (array) => {
      const buffer = device.createBuffer({
        size: Math.max(4, array.byteLength),
        usage: GPU_BUFFER_USAGE_STORAGE | GPU_BUFFER_USAGE_COPY_DST,
      });
      device.queue.writeBuffer(buffer, 0, array);
      return buffer;
    };
    this.buffers = {
      owner: make(this.dynamicState.owner),
      controller: make(this.dynamicState.controller),
      occupation: make(this.dynamicState.occupation),
    };
    // GPU semantics: the initial upload puts the full current state on the
    // device, so dirty tracking starts fresh afterwards.
    this.dynamicState.markAllClean();
    if (bufferHeader) this.staticGeometryChecksum = captureStaticGeometryChecksum(bufferHeader.buffer ?? bufferHeader, bufferHeader);
    return this.buffers;
  }

  /**
   * Per-frame upload. No-op when nothing is dirty. Returns the number of
   * dirty provinces uploaded (0 for clean frames).
   */
  uploadDirty(device) {
    if (!this.buffers) throw new Error("DynamicStateUploader.attach(device) must run before uploadDirty");
    const dirtyIndices = this.dynamicState.getDirtyIndices();
    this.frame += 1;
    if (dirtyIndices.length === 0) return 0;

    device.queue.writeBuffer(this.buffers.owner, 0, this.dynamicState.owner);
    device.queue.writeBuffer(this.buffers.controller, 0, this.dynamicState.controller);
    device.queue.writeBuffer(this.buffers.occupation, 0, this.dynamicState.occupation);
    this.dynamicState.markAllClean();
    this.totalUploads += 1;
    return dirtyIndices.length;
  }

  /** Force a full upload regardless of dirty state. */
  uploadAll(device) {
    if (!this.buffers) throw new Error("DynamicStateUploader.attach(device) must run before uploadAll");
    this.dynamicState.markAllDirty();
    return this.uploadDirty(device);
  }

  getGpuBuffers() { return this.buffers; }

  /**
   * Verify the static geometry authority is untouched after uploads, when a
   * bufferHeader was supplied at attach time. Throws on violation.
   */
  assertStaticGeometryIntact() {
    if (!this.staticGeometryChecksum) return true;
    assertStaticGeometryUnchanged(this.dynamicState.buffer, this.staticGeometryChecksum.header ?? this.staticGeometryChecksum, this.staticGeometryChecksum.snapshot ?? this.staticGeometryChecksum);
    return true;
  }

  /** Telemetry snapshot for diagnostics. */
  getTelemetry() {
    return {
      frame: this.frame,
      totalUploads: this.totalUploads,
      dirtyNow: this.dynamicState.getDirtyIndices().length,
      provinceCount: this.dynamicState.count,
    };
  }
}

export default DynamicStateUploader;
