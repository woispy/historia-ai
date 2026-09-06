import assert from "node:assert/strict";
import { getVisibleWorldCopyOffsets, worldToCanonicalLongitude } from "../../src/map/rendering/WorldWrapRender.js";
import { WORLD_MAX_X, WORLD_MIN_X, WORLD_WIDTH } from "../../src/map/camera/WorldWrap.js";

function assertVisibleCopies(cameraX, zoom, expected) {
  const offsets = getVisibleWorldCopyOffsets(cameraX, zoom);
  assert.deepEqual(offsets, expected, `unexpected world copies for camera ${cameraX} @ zoom ${zoom}`);
  assert.equal(new Set(offsets).size, offsets.length, "visible world copies must be unique");

  const halfView = WORLD_WIDTH / (2 * zoom);
  const minVisible = cameraX - halfView;
  const maxVisible = cameraX + halfView;
  for (const offset of offsets) {
    assert.ok(offset + WORLD_MAX_X >= minVisible - 1e-9, "visible copy starts before viewport");
    assert.ok(offset + WORLD_MIN_X <= maxVisible + 1e-9, "visible copy ends before viewport");
  }
}

assertVisibleCopies(0, 1, [0]);
assertVisibleCopies(179, 1, [0, 360]);
assertVisibleCopies(180, 1, [0, 360]);
assertVisibleCopies(181, 1, [0, 360]);
assertVisibleCopies(539, 1, [360, 720]);
assertVisibleCopies(900, 1, [720, 1080]);
assertVisibleCopies(-179, 1, [-360, 0]);
assertVisibleCopies(-180, 1, [-360, 0]);
assertVisibleCopies(-181, 1, [-360, 0]);

const nearAntimeridian = getVisibleWorldCopyOffsets(179, 2);
const oneWorldLater = getVisibleWorldCopyOffsets(539, 2);
assert.deepEqual(
  oneWorldLater,
  nearAntimeridian.map((offset) => offset + WORLD_WIDTH),
  "world-copy visibility must be periodic across a full 360 degree traversal",
);

for (const longitude of [-1080, -721, -540, -361, -180, -179, 0, 179, 180, 181, 359, 360, 539, 720, 1080]) {
  assert.ok(
    worldToCanonicalLongitude(longitude) >= WORLD_MIN_X && worldToCanonicalLongitude(longitude) < WORLD_MAX_X,
    `longitude ${longitude} must canonicalize into [-180, 180)`,
  );
}

const canonicalPairs = [
  [-179, 181],
  [-180, 180],
  [179, 539],
  [0, 360],
];
for (const [a, b] of canonicalPairs) {
  assert.equal(
    worldToCanonicalLongitude(a),
    worldToCanonicalLongitude(b),
    `canonical picking identity must survive +360 traversal (${a}, ${b})`,
  );
}

console.log("World-copy visibility + canonical identity regression: PASS");
