import assert from "node:assert/strict";
import { getVisibleWorldCopyOffsets, worldToCanonicalLongitude } from "../../src/map/rendering/WorldWrapRender.js";
import { getViewportBounds, isGeometryVisible } from "../../src/map/rendering/MapViewportCulling.js";

const WORLD_WIDTH = 360;
const CAMERA_POSITIONS = [-1080, -720, -360, 0, 360, 720, 1080];
const EDGE_POSITIONS = [179, 180, 181, -179, -180, -181];

function sorted(values) {
  return [...values].sort((a, b) => a - b);
}

function assertPeriodicCopies(cameraX, zoom = 2) {
  const base = sorted(getVisibleWorldCopyOffsets(cameraX, zoom));
  const shifted = sorted(getVisibleWorldCopyOffsets(cameraX + WORLD_WIDTH, zoom));
  assert.equal(shifted.length, base.length, `copy count changed at ${cameraX} -> ${cameraX + WORLD_WIDTH}`);
  for (let i = 0; i < base.length; i += 1) {
    assert.equal(
      shifted[i],
      base[i] + WORLD_WIDTH,
      `world-copy offset lost periodicity at camera ${cameraX}`,
    );
  }
}

for (const cameraX of CAMERA_POSITIONS) assertPeriodicCopies(cameraX);
for (const cameraX of EDGE_POSITIONS) assertPeriodicCopies(cameraX);

for (const cameraX of CAMERA_POSITIONS.concat(EDGE_POSITIONS)) {
  const offsets = getVisibleWorldCopyOffsets(cameraX, 2);
  assert.equal(new Set(offsets).size, offsets.length, `duplicate world copies at ${cameraX}`);
  for (const offset of offsets) {
    const canonical = worldToCanonicalLongitude(cameraX - offset);
    assert.ok(canonical >= -180 && canonical < 180, `non-canonical render sample at ${cameraX}/${offset}`);
  }
}

// The UI/SVG culling path must agree with canonical and unwrapped camera state.
const province = {
  minX: 170,
  maxX: 179,
  minY: 35,
  maxY: 42,
};
for (const canonicalX of [179, -181, 539, -541]) {
  const canonical = worldToCanonicalLongitude(canonicalX);
  const canonicalViewport = getViewportBounds({ x: canonical, zoom: 4, y: 38 }, 0);
  const unwrappedViewport = getViewportBounds({ x: canonicalX, renderX: canonicalX, zoom: 4, y: 38 }, 0);
  assert.equal(
    isGeometryVisible(province, canonicalViewport),
    isGeometryVisible(province, unwrappedViewport),
    `culling disagreement for canonical=${canonical}, render=${canonicalX}`,
  );
}

console.log("World-wrap synchronization regression: PASS");
