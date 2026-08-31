import assert from "node:assert/strict";
import { createTerrainEdgeIndexTopology } from "./TerrainEdgeIndexTopology.js";
import { validateTerrainTopologyCoverage } from "./TerrainTopologyCoverageValidator.js";
const base=createTerrainEdgeIndexTopology({size:5,edges:{}});const result=validateTerrainTopologyCoverage({indices:base.indices,vertexCount:base.vertexCount,size:5});assert.equal(result.completeGridEdgeCoverage,true);assert.equal(result.missingGridEdges,0);
const partial=new Uint32Array(base.indices.slice(0,-3));const partialResult=validateTerrainTopologyCoverage({indices:partial,vertexCount:25,size:5});assert.equal(partialResult.completeGridEdgeCoverage,false);assert.ok(partialResult.missingGridEdges>0);
console.log("Phase E terrain topology coverage: PASS");
