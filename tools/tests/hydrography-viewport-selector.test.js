import assert from 'node:assert/strict';
import test from 'node:test';
import { selectHydrographyRegions } from '../../src/map/physical/HydrographyViewportSelector.js';

const manifest = {
  regions: [
    { id: 'tile-00-00', bounds: [0, 0, 10, 10] },
    { id: 'tile-00-01', bounds: [10, 0, 20, 10] },
    { id: 'tile-01-00', bounds: { minLon: 0, maxLon: 10, minLat: 10, maxLat: 20 } },
  ],
};

test('selects intersecting regions deterministically', () => {
  assert.deepEqual(
    selectHydrographyRegions(manifest, { minLon: 8, maxLon: 12, minLat: 8, maxLat: 12 }),
    ['tile-00-00', 'tile-00-01', 'tile-01-00'],
  );
});

test('normalizes reversed viewport bounds', () => {
  assert.deepEqual(
    selectHydrographyRegions(manifest, { minLon: 12, maxLon: 8, minLat: 12, maxLat: 8 }),
    ['tile-00-00', 'tile-00-01', 'tile-01-00'],
  );
});

test('supports generated array bounds', () => {
  assert.deepEqual(
    selectHydrographyRegions({ regions: [{ id: 'tile', bounds: [24, 34, 29, 39] }] }, { minLon: 25, maxLon: 26, minLat: 35, maxLat: 36 }),
    ['tile'],
  );
});

test('caps the number of selected tiles', () => {
  assert.deepEqual(
    selectHydrographyRegions(manifest, { minLon: 0, maxLon: 20, minLat: 0, maxLat: 20 }, 2),
    ['tile-00-00', 'tile-00-01'],
  );
});

test('rejects invalid viewport and tile limits', () => {
  assert.throws(() => selectHydrographyRegions(manifest, { minLon: 0 }, 2), /Invalid hydrography viewport/);
  assert.throws(() => selectHydrographyRegions(manifest, { minLon: 0, maxLon: 1, minLat: 0, maxLat: 1 }, 0), /maxTiles/);
});
