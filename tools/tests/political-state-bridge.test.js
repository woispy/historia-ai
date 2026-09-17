/**
 * Historia AI — P7 Political State Bridge contract test.
 *
 * Verifies the game-mechanics -> dynamic-state connection:
 *  - Game events (transfer/occupy/liberate/restore) map to fail-closed state
 *    mutations with exact owner/controller/occupation semantics.
 *  - Unknown provinces and illegal operations (self-occupation, liberating
 *    an unoccupied province) are rejected.
 *  - Audit trail records every event in sequence.
 *  - flush(device) uploads the batch and asserts static geometry integrity.
 *  - applyEvent dispatches by type; unknown types are rejected.
 */

import assert from "node:assert/strict";
import { encodeMapBin } from "../build/mapbin-encoder.js";
import { ProvinceRuntimeState } from "../../src/map/runtime/ProvinceRuntimeState.js";
import { DynamicStateUploader } from "../../src/map/runtime/DynamicStateUploader.js";
import { PoliticalStateBridge } from "../../src/map/runtime/PoliticalStateBridge.js";
import { captureStaticGeometryChecksum, assertStaticGeometryUnchanged } from "../../src/map/runtime/RuntimeStateIntegrity.js";
import { BinaryMapAssetSource } from "../../src/map/runtime/BinaryMapAssetSource.js";

let passed = 0;

const entries = [
  { province: { identity: { id: 101 } }, geometry: { polygons: [[[0, 0], [1, 0], [1, 1], [0, 1]]] } },
  { province: { identity: { id: 102 } }, geometry: { polygons: [[[2, 0], [3, 0], [3, 1], [2, 1]]] } },
  { province: { identity: { id: 103 } }, geometry: { polygons: [[[4, 0], [5, 0], [5, 1], [4, 1]]] } },
];
const buffer = encodeMapBin(entries);
const runtimeState = await ProvinceRuntimeState.fromMapbin(buffer);
const mapbinSource = BinaryMapAssetSource.fromArrayBuffer(buffer);

/** Mock WebGPU device. */
function mockDevice() {
  const device = { buffers: [], queue: { writes: [], writeBuffer(b, o, d) { device.queue.writes.push({ o, len: d.byteLength }); } }, createBuffer({ size, usage }) { const r = { size, usage, data: new Uint8Array(size) }; device.buffers.push(r); return r; } };
  return device;
}

function buildBridge() {
  const state = runtimeState;
  state.dynamicState.markAllClean();
  // Reset all state fields.
  for (let i = 0; i < state.count; i += 1) {
    state.dynamicState.owner[i] = 0;
    state.dynamicState.controller[i] = 0;
    state.dynamicState.occupation[i] = 0;
  }
  state.dynamicState.markAllClean();
  const uploader = new DynamicStateUploader(state);
  uploader.attach(mockDevice());
  return new PoliticalStateBridge({ runtimeState: state, uploader, clock: () => "2026-09-15T00:00:00Z" });
}

// 1. Transfer (full conquest): owner AND controller become the new owner.
const bridge = buildBridge();
bridge.transfer("101", 7);
assert.deepEqual(bridge.getState("101"), { owner: 7, controller: 7, occupation: 0 }, "transfer must set owner AND controller");
passed += 1;

// 2. Occupy: controller = occupier, owner unchanged.
bridge.occupy("102", 9);
assert.deepEqual(bridge.getState("102"), { owner: 0, controller: 9, occupation: 0 }, "occupy must set controller only");
passed += 1;

// 2b. Self-occupation is illegal (fail-closed).
bridge.transfer("103", 5);
assert.throws(() => bridge.occupy("103", 5), /occupier is already the legitimate owner/, "cannot occupy a province you already own");
passed += 1;

// 3. Liberate: controller returns to the legitimate owner.
bridge.liberate("102");
assert.deepEqual(bridge.getState("102"), { owner: 0, controller: 0, occupation: 0 }, "liberate must return controller to owner");
assert.throws(() => bridge.liberate("102"), /not occupied/, "cannot liberate a province that is not occupied");
passed += 1;

// 4. Restore: full reset to the legitimate owner.
bridge.transfer("101", 9);
bridge.restore("101", 7);
assert.deepEqual(bridge.getState("101"), { owner: 7, controller: 7, occupation: 0 }, "restore must reset to the legitimate owner");
passed += 1;

// 5. Unknown province is rejected (fail-closed).
assert.throws(() => bridge.transfer("999", 7), /Unknown province/, "unknown province must be rejected");
assert.throws(() => bridge.getState("999"), /Unknown province/);
passed += 1;

// 6. Audit trail: every event recorded in sequence with full detail.
const history = bridge.getHistory();
assert.equal(history.length, 6);
assert.deepEqual(history.map((entry) => entry.type), ["transfer", "occupy", "transfer", "liberate", "transfer", "restore"]);
const first = history[0];
assert.equal(first.provinceId, "101");
assert.equal(first.from, 0);
assert.equal(first.to, 7);
assert.equal(first.at, "2026-09-15T00:00:00Z");
assert.equal(first.seq, 1);
passed += 1;

// 7. flush(device): uploads the batch and asserts static geometry integrity.
const header = mapbinSource.header;
const snapshot = captureStaticGeometryChecksum(buffer, header);
const uploaded = bridge.flush(mockDevice());
assert.ok(uploaded > 0, "flush must upload the dirty batch");
assertStaticGeometryUnchanged(buffer, header, snapshot);
assert.equal(bridge.uploader.getTelemetry().dirtyNow, 0, "flush must clear the dirty marks");
passed += 1;

// 8. applyEvent dispatches by type; unknown types are rejected.
const eventBridge = buildBridge();
eventBridge.applyEvent({ type: "transfer", provinceId: "101", actorId: 7 });
assert.deepEqual(eventBridge.getState("101"), { owner: 7, controller: 7, occupation: 0 });
eventBridge.applyEvent({ type: "occupy", provinceId: "101", actorId: 9 });
assert.deepEqual(eventBridge.getState("101"), { owner: 7, controller: 9, occupation: 0 });
assert.throws(() => eventBridge.applyEvent({ type: "unknown", provinceId: "101", actorId: 1 }), /Unknown event type/);
passed += 1;

console.log(`P7 political state bridge contract passed: ${passed} checks — game events -> fail-closed state mutations, audit trail, GPU flush with static geometry integrity.`);
