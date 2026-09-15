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
