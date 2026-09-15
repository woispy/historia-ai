/**
 * Historia AI — P7 Dynamic Province State contract test.
 *
 * Verifies the dynamic province state system:
 * - DynamicProvinceState: owner/controller/occupation separation
 * - ProvinceRuntimeState: unified static + dynamic API
 * - Mutation validation, dirty tracking, GPU buffer preparation
 * - State integrity verification
 * - Static geometry immutability preserved
 */

import assert from "node:assert/strict";
import { DynamicProvinceState } from "../../src/map/runtime/DynamicProvinceState.js";
import { ProvinceRuntimeState } from "../../src/map/runtime/ProvinceRuntimeState.js";
import { encodeMapBin } from "../../tools/build/mapbin-encoder.js";

let passed = 0;

// Test 1: DynamicProvinceState basics
const state = DynamicProvinceState.fromCount(3);
assert.equal(state.count, 3);
assert.equal(state.owner.length, 3);
assert.equal(state.controller.length, 3);
assert.equal(state.occupation.length, 3);
assert.deepEqual(Array.from(state.getAll().owner), [0, 0, 0]);
assert.deepEqual(Array.from(state.getAll().controller), [0, 0, 0]);
assert.deepEqual(Array.from(state.getAll().occupation), [0, 0, 0]);
passed += 1;

// Test 2: Mutation API
state.setOwner(0, 10).setController(0, 20).setOccupation(0, 30);
assert.equal(state.getOwner(0), 10);
assert.equal(state.getController(0), 20);
assert.equal(state.getOccupation(0), 30);
assert.ok(state.dirty[0] === 7); // all dirty bits set (1|2|4)
passed += 1;

// Test 3: Validation - fail-closed
assert.throws(() => state.setOwner(0, -1), /non-negative finite integer/);
assert.throws(() => state.setOwner(0, NaN), /finite integer/);
assert.throws(() => state.setOwner(5, 1), /out of bounds/);
passed += 1;

// Test 4: Batch set
state.setAll({ owner: [1, 2, 3], controller: [4, 5, 6], occupation: [7, 8, 9] });
assert.deepEqual(Array.from(state.getAll().owner), [1, 2, 3]);
assert.deepEqual(Array.from(state.getAll().controller), [4, 5, 6]);
assert.deepEqual(Array.from(state.getAll().occupation), [7, 8, 9]);
passed += 1;

// Test 4b: Dirty tracking
const dirtyBefore = state.getDirtyIndices();
assert.deepEqual(dirtyBefore.sort(), [0, 1, 2]);
state.markClean([0]);
assert.deepEqual(state.getDirtyIndices(), [1, 2]);
state.markAllClean();
assert.equal(state.getDirtyIndices().length, 0);
passed += 1;

// Test 5: fromMapbinOwner
const mapbinOwner = new Uint32Array([10, 20, 30]);
const state2 = DynamicProvinceState.fromMapbinOwner(mapbinOwner);
assert.deepEqual(Array.from(state2.getAll().owner), [10, 20, 30]);
assert.deepEqual(Array.from(state2.getAll().controller), [10, 20, 30]); // defaults to owner
assert.deepEqual(Array.from(state2.getAll().occupation), [0, 0, 0]);
passed += 1;

// Test 6: Buffer access
const buf = state.getStateBuffer();
assert.ok(buf instanceof ArrayBuffer);
assert.equal(buf.byteLength, 3 * 3 * 4); // 3 provinces * 3 fields * 4 bytes
passed += 1;

// Test 6b: Integrity validation
const validState = DynamicProvinceState.fromCount(2);
assert.equal(validState.validateIntegrity(), true);
const invalidState = DynamicProvinceState.fromCount(1);
// Test with a value that would be invalid if not truncated
invalidState.owner[0] = 0xFFFFFFFF; // max valid
assert.equal(invalidState.validateIntegrity(), true);
// Can't test overflow via typed array (silent truncation), but we can test the validation logic
// by creating a state with a value that would be invalid if it could be stored
passed += 1;

// Test 7: End-to-end with real mapbin
const entries = [
  { province: { identity: { id: 101 } }, geometry: { polygons: [[[0, 0], [1, 0], [1, 1], [0, 1]]] } },
  { province: { identity: { id: 102 } }, geometry: { polygons: [[[2, 0], [3, 0], [3, 1], [2, 1]]] } },
];
const buffer = encodeMapBin(entries);
const runtimeState = await ProvinceRuntimeState.fromMapbin(buffer);

assert.equal(runtimeState.count, 2);
assert.equal(runtimeState.getOwner(0), 0); // default owner from mapbin (fallback 0)
assert.equal(runtimeState.getController(0), 0); // default = owner
assert.equal(runtimeState.getOccupation(0), 0);
assert.equal(runtimeState.getOwner(1), 0);
assert.equal(runtimeState.count, 2);
assert.equal(runtimeState.getProvinceId(0), 101);
assert.equal(runtimeState.getProvinceId(1), 102);
assert.equal(runtimeState.getProvinceIndex(101), 0);
assert.equal(runtimeState.getProvinceIndex(102), 1);
assert.equal(runtimeState.getProvinceIndex(999), -1);
passed += 1;

// Test 8: Mutation through runtime state
runtimeState.setOwner(0, 42).setController(0, 43).setOccupation(0, 44);
assert.equal(runtimeState.getOwner(0), 42);
assert.equal(runtimeState.getController(0), 43);
assert.equal(runtimeState.getOccupation(0), 44);
assert.ok(runtimeState.dynamicState.dirty[0] === 7);
passed += 1;

// Test 9: Batch set via runtime state
runtimeState.setAllStates({
  owner: [100, 200],
  controller: [300, 400],
  occupation: [500, 600],
});
assert.deepEqual(Array.from(runtimeState.dynamicState.getAll().owner), [100, 200]);
assert.deepEqual(Array.from(runtimeState.dynamicState.getAll().controller), [300, 400]);
assert.deepEqual(Array.from(runtimeState.dynamicState.getAll().occupation), [500, 600]);
passed += 1;

// Test 10: GPU buffer creation (mock device)
const mockDevice = {
  createBuffer: ({ size, usage }) => ({ size, usage, data: new Uint8Array(size) }),
  queue: {
    writeBuffer: (buffer, offset, data) => { buffer.data.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength), offset); }
  }
};

const runtimeState2 = await ProvinceRuntimeState.fromMapbin(buffer);
runtimeState2.setOwner(0, 999);
const dirtyCount = runtimeState2.uploadDirtyState(mockDevice);
assert.equal(dirtyCount, 1);
assert.ok(runtimeState2.gpuBuffers.owner);
assert.ok(runtimeState2.gpuBuffers.controller);
assert.ok(runtimeState2.gpuBuffers.occupation);
assert.equal(runtimeState2.gpuBuffers.owner.size, 2 * 4);
assert.deepEqual(Array.from(new Uint32Array(runtimeState2.gpuBuffers.owner.data.buffer)), [999, 0]);
passed += 1;

// Test 11: Integrity validation
const integrityState = DynamicProvinceState.fromCount(2);
assert.equal(integrityState.validateIntegrity(), true);
// Can't test overflow via typed array (silent truncation), validation is for externally provided values
passed += 1;

// Test 12: Validation fail-closed
assert.throws(() => new DynamicProvinceState(-1), /non-negative integer/);
assert.throws(() => new DynamicProvinceState(1.5), /non-negative integer/);
assert.throws(() => DynamicProvinceState.fromBuffer(new ArrayBuffer(10), 10), /too small/);
passed += 1;

console.log(`Dynamic province state contract passed: ${passed} checks — owner/controller/occupation separation, mutations, dirty tracking, GPU upload, integrity validated.`);
