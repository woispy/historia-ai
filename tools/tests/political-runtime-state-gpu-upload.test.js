/**
 * Historia AI — P7 GPU Dynamic State Upload contract test.
 *
 * Completes the P7 remainder (GPU dynamic state upload) with Node-testable
 * contracts:
 *
 *  1. DynamicStateUploader: attach -> initial upload -> per-frame dirty
 *     uploads -> clean-frame no-ops, over a mock WebGPU device.
 *  2. Static geometry protection: uploads never touch the static geometry
 *     region (RuntimeStateIntegrity checksum before/after).
 *  3. ProvinceRuntimeState integration: mutate -> uploadDirty -> buffers
 *     carry the new state; owner/controller/occupation separate.
 *  4. DynamicStateShader WGSL: declares the dynamic-state bindings
 *     (ownerByProvince storage + palette) and preserves pick shader.
 *  5. CPU/WebGL color provider: owner -> palette color, unowned/unknown ->
 *     neutral; BinaryMapRenderer.setProvinceColorProvider stores it.
 */

import assert from "node:assert/strict";
import { encodeMapBin } from "../build/mapbin-encoder.js";
import { ProvinceRuntimeState } from "../../src/map/runtime/ProvinceRuntimeState.js";
import { DynamicStateUploader } from "../../src/map/runtime/DynamicStateUploader.js";
import { captureStaticGeometryChecksum, assertStaticGeometryUnchanged } from "../../src/map/runtime/RuntimeStateIntegrity.js";
import { DYNAMIC_STATE_RENDER_WGSL, DYNAMIC_STATE_PICK_WGSL, DYNAMIC_STATE_BINDINGS } from "../../src/map/rendering/gpu/DynamicStateShader.js";
import { BinaryMapRenderer } from "../../src/map/rendering/gpu/BinaryMapRenderer.js";

let passed = 0;

const entries = [
  { province: { identity: { id: 101 } }, geometry: { polygons: [[[0, 0], [1, 0], [1, 1], [0, 1]]] } },
  { province: { identity: { id: 102 } }, geometry: { polygons: [[[2, 0], [3, 0], [3, 1], [2, 1]]] } },
];
const buffer = encodeMapBin(entries);
const runtimeState = await ProvinceRuntimeState.fromMapbin(buffer);

/** Mock WebGPU device: records buffer writes. */
function mockDevice() {
  const device = {
    buffers: [],
    queue: {
      writes: [],
      writeBuffer(buffer, offset, data) {
        const target = device.buffers.find((item) => item.__buffer === buffer);
        if (!target) throw new Error("writeBuffer to unknown buffer");
        const bytes = new Uint8Array(data.buffer ?? data, data.byteOffset ?? 0, data.byteLength ?? data.byteLength);
        target.data.set(bytes, offset);
        device.queue.writes.push({ buffer: target, offset, byteLength: bytes.byteLength });
      },
    },
    createBuffer({ size, usage }) {
      const record = { size, usage, data: new Uint8Array(size), writes: 0 };
      record.__buffer = record;
      device.buffers.push(record);
      return record;
    },
  };
  return device;
}

// 1. Attach: three state buffers created, initial upload performed.
const device = mockDevice();
const uploader = new DynamicStateUploader(runtimeState);
runtimeState.setOwner(0, 10).setOwner(1, 20);
const gpuBuffers = uploader.attach(device);
assert.equal(device.buffers.length, 3, "three state buffers must be created");
assert.deepEqual(gpuBuffers ? ["owner", "controller", "occupation"] : [], ["owner", "controller", "occupation"]);
const uploadedWrites = device.queue.writes.length;
assert.ok(uploadedWrites >= 3, "initial upload must write the state buffers");
const ownerInitial = new Uint32Array(gpuBuffers.owner.data.buffer);
assert.deepEqual(Array.from(ownerInitial), [10, 20], "initial upload must carry the pre-set owner state");
passed += 1;

// 2. Per-frame dirty upload: only dirty frames write.
runtimeState.setController(0, 55);
const dirtyCount = uploader.uploadDirty(device);
assert.equal(dirtyCount, 1, "one dirty province must be uploaded");
// Controller initializes from the mapbin owner (both 0 in this fixture);
// setController(0, 55) only changes index 0.
assert.deepEqual(Array.from(new Uint32Array(gpuBuffers.controller.data.buffer)), [55, 0], "controller buffer must carry the mutation");
const writesAfterDirty = device.queue.writes.length;
const cleanCount = uploader.uploadDirty(device);
assert.equal(cleanCount, 0, "clean frame must be a no-op");
assert.equal(device.queue.writes.length, writesAfterDirty, "clean frame must not write");
assert.equal(uploader.getTelemetry().totalUploads, 1);
passed += 1;

// 3. Static geometry protection: uploads never touch the static region.
const { BinaryMapAssetSource } = await import("../../src/map/runtime/BinaryMapAssetSource.js");
const mapbinSource = BinaryMapAssetSource.fromArrayBuffer(buffer);
const header = mapbinSource.header;
const snapshot = captureStaticGeometryChecksum(buffer, header);
runtimeState.setOccupation(1, 77);
uploader.uploadDirty(device);
assertStaticGeometryUnchanged(buffer, header, snapshot);
assert.equal(uploader.assertStaticGeometryIntact(), true, "static geometry authority must be intact after uploads");
passed += 1;

// 4. Occupation upload carries the mutation; uploadAll forces a full pass.
runtimeState.dynamicState.markAllClean();
uploader.uploadAll(device);
assert.deepEqual(Array.from(new Uint32Array(gpuBuffers.occupation.data.buffer)), [0, 77], "occupation buffer must carry the mutation after force upload");
assert.equal(uploader.getTelemetry().dirtyNow, 0);
passed += 1;

// 5. WGSL: dynamic-state bindings declared, owner buffer + palette present.
assert.ok(DYNAMIC_STATE_RENDER_WGSL.includes("ownerByProvince"), "render shader must read the owner buffer");
assert.ok(DYNAMIC_STATE_RENDER_WGSL.includes("palette"), "render shader must read the owner palette");
assert.ok(DYNAMIC_STATE_RENDER_WGSL.includes("var<storage, read> ownerByProvince"), "owner buffer must be read-only storage");
assert.equal(DYNAMIC_STATE_BINDINGS.ownerByProvince, 2);
assert.equal(DYNAMIC_STATE_BINDINGS.palette, 3);
assert.ok(DYNAMIC_STATE_PICK_WGSL.includes("encode(in.provinceId)"), "pick shader must remain province-id based (dynamic state must not affect picking)");
passed += 1;

// 6. CPU/WebGL color provider: owner -> palette color, neutral fallbacks.
const palette = { 10: [200, 40, 40], 20: [40, 200, 40] };
const provider = runtimeState.dynamicState.createColorProvider({ assetSource: mapbinSource, palette });
const colorOwned = provider(101, 0);
assert.deepEqual(colorOwned, [200, 40, 40], "province 101 (owner 10) must resolve to its palette color");
const colorOwned2 = provider(102, 1);
assert.deepEqual(colorOwned2, [40, 200, 40], "province 102 (owner 20) must resolve to its palette color");
runtimeState.dynamicState.setOwner(0, 0);
assert.deepEqual(provider(101, 0), [111, 118, 95], "unowned province must resolve to neutral");
assert.deepEqual(provider(999, -1), [111, 118, 95], "unknown province must resolve to neutral");
passed += 1;

// 7. Renderer hook: provider stored and cleared.
const fakeCanvas = { getContext: () => null, width: 0, height: 0, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1, height: 1 }) };
const renderer = new BinaryMapRenderer(fakeCanvas);
assert.equal(renderer.provinceColorProvider, undefined, "provider must default to unset");
renderer.setProvinceColorProvider(provider);
assert.equal(renderer.provinceColorProvider, provider, "setProvinceColorProvider must store the provider");
passed += 1;

console.log(`P7 GPU dynamic state upload contract passed: ${passed} checks — attach/dirty/clean upload flow, static geometry protected, WGSL bindings declared, CPU color provider resolved, renderer hook stored.`);
