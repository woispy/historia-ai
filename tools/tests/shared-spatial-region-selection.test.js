import assert from "node:assert/strict";

function normalizeBounds(bounds) {
  assert.ok(bounds && Number.isFinite(bounds.minX) && Number.isFinite(bounds.maxX));
  assert.ok(Number.isFinite(bounds.minY) && Number.isFinite(bounds.maxY));
  return {
    minX: Math.min(bounds.minX, bounds.maxX),
    maxX: Math.max(bounds.minX, bounds.maxX),
    minY: Math.min(bounds.minY, bounds.maxY),
    maxY: Math.max(bounds.minY, bounds.maxY),
  };
}

function intersects(bounds, region) {
  return !(region.maxX < bounds.minX || region.minX > bounds.maxX || region.maxY < bounds.minY || region.minY > bounds.maxY);
}

function selectIntersectingRegions(bounds, regions, maxRegions = Infinity) {
  const normalized = normalizeBounds(bounds);
  return regions
    .filter((region) => intersects(normalized, region.bounds))
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, maxRegions)
    .map((region) => region.id);
}

const regions = [
  { id: "anatolia", bounds: { minX: 25, minY: 35, maxX: 45, maxY: 45 } },
  { id: "balkans", bounds: { minX: 15, minY: 35, maxX: 30, maxY: 50 } },
  { id: "north-africa", bounds: { minX: -15, minY: 15, maxX: 35, maxY: 38 } },
];

assert.deepEqual(selectIntersectingRegions({ minX: 30, minY: 38, maxX: 40, maxY: 42 }, regions), ["anatolia"]);
assert.deepEqual(selectIntersectingRegions({ minX: 20, minY: 36, maxX: 32, maxY: 42 }, regions), ["anatolia", "balkans"]);
assert.deepEqual(selectIntersectingRegions({ minX: 40, minY: 45, maxX: 25, maxY: 35 }, regions), ["anatolia", "balkans"]);
assert.deepEqual(selectIntersectingRegions({ minX: 0, minY: 0, maxX: 60, maxY: 60 }, regions, 2), ["anatolia", "balkans"]);
assert.deepEqual(selectIntersectingRegions({ minX: 60, minY: 60, maxX: 70, maxY: 70 }, regions), []);

console.log("shared spatial region selection: PASS");
