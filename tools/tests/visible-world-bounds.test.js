import assert from 'node:assert/strict';
import test from 'node:test';
import { getVisibleWorldBounds } from '../../src/map/camera/viewport/VisibleWorldBoundsService.js';

const camera = { x: 100, y: 50, zoom: 2 };

test('visible world bounds cover all four converted viewport corners', () => {
  const bounds = getVisibleWorldBounds(camera, { width: 800, height: 600 });

  assert.deepEqual(bounds, {
    minX: -100,
    minY: -100,
    maxX: 300,
    maxY: 200,
  });
});

test('visible world bounds respond to camera translation', () => {
  const bounds = getVisibleWorldBounds({ ...camera, x: 300, y: -25 }, { width: 800, height: 600 });

  assert.deepEqual(bounds, {
    minX: 100,
    minY: -175,
    maxX: 500,
    maxY: 125,
  });
});

test('visible world bounds respond to zoom', () => {
  const bounds = getVisibleWorldBounds({ ...camera, zoom: 1 }, { width: 800, height: 600 });

  assert.deepEqual(bounds, {
    minX: -200,
    minY: -250,
    maxX: 600,
    maxY: 350,
  });
});

test('zero-sized viewport returns the camera origin bounds', () => {
  const bounds = getVisibleWorldBounds(camera, { width: 0, height: 0 });

  assert.deepEqual(bounds, {
    minX: 100,
    minY: 50,
    maxX: 100,
    maxY: 50,
  });
});

test('invalid viewport dimensions are rejected', () => {
  assert.throws(
    () => getVisibleWorldBounds(camera, { width: -1, height: 600 }),
    RangeError,
  );
  assert.throws(
    () => getVisibleWorldBounds(camera, { width: Number.NaN, height: 600 }),
    RangeError,
  );
});
