import assert from "node:assert/strict";
import { createTerrainGpuMemoryBudget } from "./TerrainGpuMemoryBudget.js";

const budget = createTerrainGpuMemoryBudget({ maxBytes: 4096 });
assert.equal(budget.allocate("a", 2048), true);
assert.equal(budget.usedBytes(), 2048);
assert.equal(budget.availableBytes(), 2048);
assert.equal(budget.allocate("b", 2048), true);
assert.equal(budget.allocate("c", 1), false);
assert.throws(() => budget.allocate("a", 1), /already exists/);
assert.equal(budget.release("a"), 2048);
assert.equal(budget.usedBytes(), 2048);
assert.equal(budget.allocate("c", 1024), true);
assert.deepEqual(budget.snapshot(), [{ tileId: "b", bytes: 2048 }, { tileId: "c", bytes: 1024 }]);
assert.throws(() => budget.release("missing"), /does not exist/);
console.log("Phase E terrain GPU memory budget: PASS");
