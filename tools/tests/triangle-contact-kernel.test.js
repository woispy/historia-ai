import assert from "node:assert/strict";
import { classifyTriangleContact } from "../historical-gis/TriangleContactKernel.js";

const triangle = (ids, points) => ({ ids, points });
const A = triangle([0,1,2], [[0,0],[4,0],[0,4]]);
const sharedEdge = triangle([1,0,3], [[4,0],[0,0],[4,4]]);
const sharedVertex = triangle([0,3,4], [[0,0],[4,4],[-3,2]]);
const crossing = triangle([3,4,5], [[2,-1],[2,5],[5,2]]);
const tJunction = triangle([6,7,8], [[2,0],[5,1],[2,5]]);
const partial = triangle([9,10,11], [[2,0],[6,0],[2,2]]);
const contained = triangle([12,13,14], [[1,1],[2,1],[1,2]]);
const duplicate = triangle([0,2,1], [[0,0],[0,4],[4,0]]);
const disjoint = triangle([20,21,22], [[20,20],[21,20],[20,21]]);

assert.equal(classifyTriangleContact(A, sharedEdge), "shared-edge");
assert.equal(classifyTriangleContact(A, sharedVertex), "shared-vertex");
assert.equal(classifyTriangleContact(A, crossing), "crossing");
assert.equal(classifyTriangleContact(A, tJunction), "t-junction");
assert.equal(classifyTriangleContact(A, partial), "partial-edge-overlap");
assert.equal(classifyTriangleContact(A, contained), "overlap");
assert.equal(classifyTriangleContact(A, duplicate), "duplicate-triangle");
assert.equal(classifyTriangleContact(A, disjoint), "disjoint");

console.log("Triangle contact kernel contract passed.");
