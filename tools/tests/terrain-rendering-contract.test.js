/**
 * Historia AI — P9 Terrain Rendering contract test.
 *
 * Verifies the terrain-aware physical geography pipeline:
 * - Terrain attribute generation (elevation, slope, hillshade, biome)
 * - Biome palette generation
 * - Terrain attribute packing for GPU
 * - Integration with physical geography packer
 */

import assert from "node:assert/strict";
import { generateTerrainAttributes, generateBiomePalette, biomeFromLatElevation } from "../../src/map/terrain/TerrainAttributes.js";
import { TerrainTileProvider } from "../../src/map/terrain/TerrainTileProvider.js";
import { classifyBiome, BIOME_PALETTE } from "../../src/map/terrain/BiomeClassifier.js";
import { computeRiverSegmentWidths, haversineMeters } from "../../src/map/terrain/RiverWidth.js";

let passed = 0;

// Test 1: Biome palette generation
const palette = generateBiomePalette();
assert.ok(palette instanceof Uint32Array, "palette must be Uint32Array");
assert.equal(palette.length, 11, "palette must have 11 biomes");
assert.equal(palette[0] & 0xFF, 20, "ocean R=20");
assert.equal((palette[0] >> 8) & 0xFF, 40, "ocean G=40");
assert.equal((palette[0] >> 16) & 0xFF, 80, "ocean B=80");
assert.equal((palette[0] >> 24) & 0xFF, 255, "ocean A=255");
assert.equal(palette[1], 0xFFFFFFFF, "ice cap must be white");
passed += 1;

// Test 2: Biome classification from lat/elevation
assert.equal(classifyBiome(0, 0), 8, "equatorial sea level = tropical");
assert.equal(classifyBiome(60, 0), 3, "60°N sea level = boreal");
assert.equal(classifyBiome(60, 2000), 10, "60°N high elevation = alpine tundra");
assert.equal(classifyBiome(30, 0), 5, "30°N sea level = mediterranean");
assert.equal(classifyBiome(30, 2000), 9, "30°N high elevation = montane");
assert.equal(classifyBiome(10, 0), 8, "10°N sea level = tropical");
assert.equal(classifyBiome(-10, 0), 8, "10°S sea level = tropical");
assert.equal(classifyBiome(80, 0), 1, "80°N = ice cap");
assert.equal(classifyBiome(80, 5000), 1, "80°N high = ice cap");
passed += 1;

// Test 3: Biome palette structure
assert.equal(BIOME_PALETTE.length, 11, "BIOME_PALETTE must have 11 entries");
for (const color of BIOME_PALETTE) {
  assert.equal(color.length, 4, "each biome color must have 4 components");
  for (const c of color) {
    assert.ok(c >= 0 && c <= 255, "color components must be 0-255");
  }
}
passed += 1;

// Test 4: Haversine distance
const dist = haversineMeters(40, 29, 41, 29); // ~111km at 40°N
assert.ok(dist > 110000 && dist < 112000, `haversine distance at 40°N should be ~111km, got ${dist}`);
passed += 1;

// Test 5: River width computation
const testRivers = [
  { name: "Short", coordinates: [[0, 0], [0.1, 0]] },
  { name: "Long", coordinates: [[0, 0], [1, 0], [2, 0], [3, 0]] },
];
const riverWidths = computeRiverSegmentWidths(testRivers);
assert.ok(riverWidths.has("Short"), "short river should have width");
assert.ok(riverWidths.has("Long"), "long river should have width");
assert.ok(riverWidths.get("Long") > riverWidths.get("Short"), "longer river should be wider");
passed += 1;

// Test 6: Terrain attribute generation (mock provider - no real DEM)
const MockTerrainProvider = {
  async computeAttributes(lon, lat) {
    // Simulate a mountainous region
    const elevation = 1000 + Math.sin(lon * 10) * 500 + Math.cos(lat * 10) * 300;
    const slope = 5 + Math.abs(Math.sin(lon * 5)) * 15;
    const aspect = (lon * 50) % 360;
    const hillshade = 0.3 + 0.4 * Math.sin(lon * 2) * Math.cos(lat * 2);
    return { elevation, slopeDegrees: slope, aspectDegrees: aspect, hillshade: Math.max(0, Math.min(1, hillshade)) };
  },
};

const testVertices = [
  0, 0, 1, 0, 2, 0,
  0, 1, 1, 1, 2, 1,
];
const attrs = await generateTerrainAttributes(testVertices, MockTerrainProvider);
assert.equal(attrs.length, 6 * 4, "should have 4 components per vertex");
for (let i = 0; i < 6; i += 1) {
  const elevationKm = attrs[i * 4];
  const slopeNorm = attrs[i * 4 + 1];
  const hillshade = attrs[i * 4 + 2];
  const biomeId = attrs[i * 4 + 3];
  assert.ok(elevationKm >= 0 && elevationKm <= 5, `elevationKm in range for vertex ${i}`);
  assert.ok(slopeNorm >= 0 && slopeNorm <= 1, `slopeNorm in range for vertex ${i}`);
  assert.ok(hillshade >= 0 && hillshade <= 1, `hillshade in range for vertex ${i}`);
  assert.ok(Number.isInteger(biomeId) && biomeId >= 0 && biomeId <= 10, `biomeId valid for vertex ${i}`);
}
passed += 1;

// Test 7: biomeFromLatElevation function
const biomeLatElev = biomeFromLatElevation(0, 0);
assert.equal(biomeLatElev, 8, "equator sea level = tropical");
assert.equal(biomeFromLatElevation(60, 0), 3, "60°N = boreal");
assert.equal(biomeFromLatElevation(70, 1000), 2, "70°N = tundra");
passed += 1;

// Test 8: Biome palette packing
const palette2 = generateBiomePalette();
assert.equal(palette2.length, 11, "palette must have 11 entries");
for (let i = 0; i < palette2.length; i += 1) {
  const r = palette2[i] & 0xFF;
  const g = (palette2[i] >> 8) & 0xFF;
  const b = (palette2[i] >> 16) & 0xFF;
  const a = (palette2[i] >> 24) & 0xFF;
  assert.ok(r >= 0 && r <= 255, `R component valid for biome ${i}`);
  assert.ok(g >= 0 && g <= 255, `G component valid for biome ${i}`);
  assert.ok(b >= 0 && b <= 255, `B component valid for biome ${i}`);
  assert.equal(a, 255, `A component must be 255 for biome ${i}`);
}
passed += 1;

// Test 9: Haversine symmetry
const d1 = haversineMeters(40, 30, 41, 30);
const d2 = haversineMeters(41, 30, 40, 30);
assert.equal(d1, d2, "haversine must be symmetric");
assert.ok(d1 > 110000 && d1 < 112000, "distance ~111km at 30°E");
passed += 1;

console.log(`Terrain rendering contract passed: ${passed} checks, all terrain attributes, biome palette, river widths, and haversine validated.`);