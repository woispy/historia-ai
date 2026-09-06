import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { validateProvinceSeedSet } from "../historical-gis/province/ProvinceSeedModel.js";
import { SpatialSeedIndex } from "../historical-gis/province/SpatialSeedIndex.js";
import { createCostField } from "../historical-gis/province/CostField.js";
import { adaptDemSample, adaptHydrographySample, composeCostSamples } from "../historical-gis/province/CostAdapters.js";
import { CompositeCostGraph } from "../historical-gis/province/CompositeCostGraph.js";
import { LeastCostPathSolver } from "../historical-gis/province/LeastCostPathSolver.js";
import { AuthoritativeArcRegistry, registerSolverPath } from "../historical-gis/province/AuthoritativeArcGenerator.js";
import { validateArcGeometry } from "../historical-gis/province/GeometryValidation.js";

const GRID_WIDTH = 120;
const GRID_HEIGHT = 80;
const GRID_BOUNDS = Object.freeze({ minLon: 26, maxLon: 44.8, minLat: 36, maxLat: 42.4 });
const HYDROGRAPHY_PATH = "src/map/data/generated/anatolia-hydrography-10m.json";
const HYDROGRAPHY = JSON.parse(await readFile(HYDROGRAPHY_PATH, "utf8"));
const MAJOR_RIVERS = HYDROGRAPHY.rivers
  .filter((river) => river.canonicalId && Number(river.rank) <= 3)
  .map((river) => river.coordinates)
  .filter((coordinates) => Array.isArray(coordinates) && coordinates.length >= 2);

assert.equal(HYDROGRAPHY.projection, "EPSG:4326");
assert.ok(HYDROGRAPHY.rivers.length > 0, "generated Natural Earth hydrography must contain river segments");
assert.ok(HYDROGRAPHY.lakes.length > 0, "generated Natural Earth hydrography must contain lake polygons");
assert.ok(MAJOR_RIVERS.length >= 3, "major Anatolian river identities must survive hydrography generation");

function distancePointToSegment(point, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point[0] - a[0], point[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
  return Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy));
}

function distanceToPolylines(lon, lat, polylines) {
  let best = Infinity;
  for (const line of polylines) {
    for (let i = 1; i < line.length; i += 1) best = Math.min(best, distancePointToSegment([lon, lat], line[i - 1], line[i]));
  }
  return best;
}

function distanceToAtlasRanges(lon, lat) {
  return distanceToPolylines(lon, lat, ANATOLIA_PHYSICAL_ATLAS.mountainRanges.map((range) => range.coordinates));
}

function distanceToRivers(lon, lat) {
  return distanceToPolylines(lon, lat, MAJOR_RIVERS);
}

function makeSeeds() {
  return validateProvinceSeedSet(ANATOLIA_PROVINCE_METADATA.map((item) => ({
    id: item.id,
    identity: { key: item.id, name: item.name, type: "province" },
    position: { lon: item.centroid[0], lat: item.centroid[1] },
    historical: {
      validFrom: 1300,
      validTo: null,
      sourceIds: [`anatolia-metadata:${item.id}`],
      confidence: {
        existence: item.historicalControl.confidence === "high" ? 1 : item.historicalControl.confidence === "medium" ? 0.75 : 0.5,
        location: 0.95,
        extent: item.borderConfidence === "high" ? 0.85 : item.borderConfidence === "medium" ? 0.65 : 0.4,
        boundary: item.borderConfidence === "high" ? 0.8 : 0.35,
        ownership: item.historicalControl.controllerAt1300 ? 0.8 : 0.35,
      },
    },
    hierarchy: { parentId: item.regionId, ancestry: [item.regionId] },
    constraints: {
      boundaryMode: item.borderConfidence === "high" ? "soft" : "inferred",
      physical: {
        landOnly: true,
        avoidWater: true,
        riverCrossingCost: 3.5,
        mountainCrossingCost: 5,
        ridgeAffinity: 8,
        coastAffinity: 2,
      },
    },
  })));
}

function makePhysicalSample(node) {
  const mountainDistance = distanceToAtlasRanges(node.lon, node.lat);
  const riverDistance = distanceToRivers(node.lon, node.lat);
  const mountainResistance = Math.max(0, 1 - mountainDistance / 0.65);
  const ridgeAffinity = Math.max(0, 1 - Math.abs(mountainDistance - 0.18) / 0.22);
  const riverPenalty = Math.max(0, 1 - riverDistance / 0.12);
  const dem = adaptDemSample({
    slopeNormalized: Math.min(1, mountainResistance * 0.9),
    ridgeAffinity,
    mountainResistance,
  });
  const hydro = adaptHydrographySample({ riverPenalty });
  return composeCostSamples(dem, hydro);
}

function nearestGraphNode(graph, seed) {
  const x = Math.max(0, Math.min(graph.width - 1, Math.floor(((seed.position.lon - graph.bounds.minLon) / (graph.bounds.maxLon - graph.bounds.minLon)) * graph.width)));
  const y = Math.max(0, Math.min(graph.height - 1, Math.floor(((seed.position.lat - graph.bounds.minLat) / (graph.bounds.maxLat - graph.bounds.minLat)) * graph.height)));
  return graph.node(x, y);
}

const seeds = makeSeeds();
assert.equal(seeds.length, ANATOLIA_PROVINCE_METADATA.length, "the full curated 1300 Anatolia seed set must be exercised");
assert.ok(seeds.length >= 30, "stress harness requires a genuinely regional seed population");

const index = new SpatialSeedIndex({ cellSize: 1 });
for (const seed of seeds) index.insert(seed);
assert.equal(index.size, seeds.length);

const field = createCostField({
  weights: { slope: 1.1, ridge: 1.4, mountain: 2.2, river: 2.0, lake: 1.5, coast: 0.35 },
  metadata: { source: "AnatoliaPhysicalAtlas v2 + generated Natural Earth 10m hydrography", epoch: 1300 },
});

const graph = new CompositeCostGraph({
  width: GRID_WIDTH,
  height: GRID_HEIGHT,
  bounds: GRID_BOUNDS,
  sampleCell: makePhysicalSample,
  transitionCost: (from, to, fromSample, toSample) => field.evaluate({
    slope: (fromSample.slope + toSample.slope) / 2,
    ridge: (fromSample.ridge + toSample.ridge) / 2,
    mountain: (fromSample.mountain + toSample.mountain) / 2,
    river: (fromSample.river + toSample.river) / 2,
    lake: (fromSample.lake + toSample.lake) / 2,
    coast: (fromSample.coast + toSample.coast) / 2,
  }).total + 0.05,
  blocked: (node) => node.lat < 36.05 || node.lat > 42.25,
});

const solver = new LeastCostPathSolver({ graph, minimumCost: 0.05, maxIterations: 200000 });
const registry = new AuthoritativeArcRegistry({ tolerance: 1e-6 });
const diagnostics = [];
let solved = 0;
let failed = 0;
let candidatePairs = 0;

for (const seed of seeds) {
  const neighbours = index.queryRadius(seed.position.lon, seed.position.lat, 2.25)
    .filter((candidate) => candidate.id !== seed.id)
    .slice(0, 2);
  for (const neighbour of neighbours) {
    if (seed.id.localeCompare(neighbour.id) >= 0) continue;
    candidatePairs += 1;
    const start = nearestGraphNode(graph, seed);
    const end = nearestGraphNode(graph, neighbour);
    const result = solver.solve({ start, end });
    if (!result.path) {
      failed += 1;
      diagnostics.push({ seed: seed.id, neighbour: neighbour.id, reason: result.reason, iterations: result.iterations });
      continue;
    }
    solved += 1;
    assert.ok(result.cost >= 0 && Number.isFinite(result.cost));
    assert.ok(result.path.length >= 2);

    // Stress edge only: this is deliberately not a historical province border.
    // It exercises authoritative node/arc identity before face generation.
    const registration = registerSolverPath(registry, {
      result,
      leftFace: `stress:${seed.id}`,
      rightFace: `stress:${neighbour.id}`,
      kind: "stress-edge",
      confidence: 0.5,
      nodeKind: "corner",
    });
    assert.ok(registration.arc);
    assert.ok(validateArcGeometry(registration.arc).valid);
  }
}

assert.ok(candidatePairs >= 20, `expected broad regional adjacency coverage, got ${candidatePairs}`);
assert.ok(solved >= Math.floor(candidatePairs * 0.75), `least-cost solver success rate too low: ${solved}/${candidatePairs}; diagnostics=${JSON.stringify(diagnostics.slice(0, 8))}`);
assert.ok(registry.nodes.size > 20, "authoritative registry should receive a regional node population");
assert.ok(registry.arcs.size > 15, "authoritative registry should receive a regional arc population");

const topology = registry.toTopology();
for (const arc of Object.values(topology.arcs)) {
  assert.ok(arc.geometry.length >= 2);
  assert.notEqual(arc.startNode, arc.endNode);
  assert.ok(validateArcGeometry(arc).valid);
}

const highMountainSeed = seeds.find((seed) => seed.id === "bithynia-prusa");
const plateauSeed = seeds.find((seed) => seed.id === "galatia-ankara");
assert.ok(highMountainSeed && plateauSeed);
const mountainSample = makePhysicalSample({ lon: highMountainSeed.position.lon, lat: highMountainSeed.position.lat });
const plateauSample = makePhysicalSample({ lon: plateauSeed.position.lon, lat: plateauSeed.position.lat });
assert.ok(mountainSample.mountain >= 0 && plateauSample.mountain >= 0);
assert.ok(Number.isFinite(field.evaluate(mountainSample).total));
assert.ok(Number.isFinite(field.evaluate(plateauSample).total));

console.log(`Anatolia seed + physical-cost stress: PASS (${seeds.length} seeds, ${candidatePairs} candidate pairs, ${solved} solved, ${failed} failed, ${registry.nodes.size} nodes, ${registry.arcs.size} arcs, ${MAJOR_RIVERS.length} major river segments)`);
