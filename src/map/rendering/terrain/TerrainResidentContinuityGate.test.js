import assert from "node:assert/strict";
import { createTerrainResidentContinuityGate } from "./TerrainResidentContinuityGate.js";

const a={width:2,height:2,samples:new Float32Array([1,2,3,4])};
const b={width:2,height:2,samples:new Float32Array([2,9,4,8])};
const map=new Map([["a",a],["b",b]]);
const gate=createTerrainResidentContinuityGate({getResidentTile:id=>map.get(id),tolerance:0});
assert.equal(gate.validate("a",{east:"b"}).drawable,true);
map.delete("b"); assert.equal(gate.validate("a",{east:"b"}).reason,"neighbor-not-resident");
assert.equal(gate.validate("missing",{}).reason,"tile-not-resident");
console.log("Phase E resident continuity gate: PASS");
