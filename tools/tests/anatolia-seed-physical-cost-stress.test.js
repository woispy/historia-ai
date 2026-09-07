import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { validateProvinceSeedSet } from "../historical-gis/province/ProvinceSeedModel.js";
import { SpatialHashSeedIndex } from "../historical-gis/province/SpatialSeedIndex.js";
import { createCostField } from "../historical-gis/province/CostField.js";
import { adaptHydrographySample, composeCostSamples } from "../historical-gis/province/CostAdapters.js";
import { CopernicusDemCostSampler } from "../historical-gis/province/CopernicusDemCostSampler.js";
import { RidgeWatershedAnalyzer, measureRidgeAlignment } from "../historical-gis/province/TerrainRidgeAnalysis.js";
import { refineLeastCostPath, comparePathResolution } from "../historical-gis/province/AdaptivePathRefiner.js";
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
  const dx = b[0] - a[0], dy = b[1] - a[1], lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point[0] - a[0], point[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
  return Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy));
}

function distanceToRivers(lon, lat) {
  let best = Infinity;
  for (const line of MAJOR_RIVERS) for (let i = 1; i < line.length; i += 1) best = Math.min(best, distancePointToSegment([lon, lat], line[i - 1], line[i]));
  return best;
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
    constraints: { boundaryMode: item.borderConfidence === "high" ? "soft" : "inferred", physical: { landOnly: true, avoidWater: true, riverCrossingCost: 3.5, mountainCrossingCost: 5, ridgeAffinity: 8, coastAffinity: 2 } },
  })));
}

function nearestGraphNode(graph, seed) {
  const x = Math.max(0, Math.min(graph.width - 1, Math.floor(((seed.position.lon - graph.bounds.minLon) / (graph.bounds.maxLon - graph.bounds.minLon)) * graph.width)));
  const y = Math.max(0, Math.min(graph.height - 1, Math.floor(((seed.position.lat - graph.bounds.minLat) / (graph.bounds.maxLat - graph.bounds.minLat)) * graph.height)));
  return graph.node(x, y);
}

const seeds = makeSeeds();
assert.equal(seeds.length, ANATOLIA_PROVINCE_METADATA.length, "the full curated 1300 Anatolia seed set must be exercised");
assert.ok(seeds.length >= 30, "stress harness requires a genuinely regional seed population");

const index = new SpatialHashSeedIndex({ cellSize: 1 });
for (const seed of seeds) index.insert(seed);
assert.equal(index.size, seeds.length);

const demSampler = await new CopernicusDemCostSampler({ bounds: GRID_BOUNDS }).initialize();
assert.ok(demSampler.entries.size >= 100, `expected broad Copernicus source coverage, got ${demSampler.entries.size}`);

const ridgeAnalyzer = new RidgeWatershedAnalyzer({
  elevationAt: (node) => demSampler.elevation(node),
  stepDegrees: 0.01,
  ridgeProminenceMeters: 120,
});

const field = createCostField({
  weights: { slope: 1.1, ridge: 1.4, mountain: 2.2, river: 2.0, lake: 1.5, coast: 0.35 },
  metadata: { source: "Copernicus GLO-30 + generated Natural Earth 10m hydrography + local ridge/divide morphology", epoch: 1300 },
});

function physicalSample(node) {
  const dem = demSampler.sample(node);
  const ridge = ridgeAnalyzer.analyze(node);
  const riverDistance = distanceToRivers(node.lon, node.lat);
  const hydro = adaptHydrographySample({ riverPenalty: Math.max(0, 1 - riverDistance / 0.12) });
  return composeCostSamples(dem, hydro, { ridge: ridge.ridgeCost });
}

function buildGraph({ bounds = GRID_BOUNDS, width = GRID_WIDTH, height = GRID_HEIGHT } = {}) {
  return new CompositeCostGraph({
    width,
    height,
    bounds,
    sampleCell: physicalSample,
    transitionCost: (from, to, fromSample, toSample) => field.evaluate({
      slope: (fromSample.slope + toSample.slope) / 2,
      ridge: (fromSample.ridge + toSample.ridge) / 2,
      mountain: (fromSample.mountain + toSample.mountain) / 2,
      river: (fromSample.river + toSample.river) / 2,
      lake: (fromSample.lake + toSample.lake) / 2,
      coast: (fromSample.coast + toSample.coast) / 2,
    }).total + 0.05,
    blocked: (node) => node.lat < 36.05 || node.lat > 42.35,
  });
}

function buildSolver(graph) { return new LeastCostPathSolver({ graph, minimumCost: 0.05, maxIterations: 200000 }); }

const graph = buildGraph();
const solver = buildSolver(graph);
const registry = new AuthoritativeArcRegistry({ tolerance: 1e-6 });
const diagnostics = [];
const adaptiveDiagnostics = [];
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
    assert.ok(Number.isFinite(result.cost) && result.cost >= 0);
    assert.ok(result.path.length >= 2);

    if (adaptiveDiagnostics.length < 8) {
      const coarseQuality = measureRidgeAlignment(result.path, ridgeAnalyzer);
      try {
        const refinement = refineLeastCostPath({
          coarseGraph: graph,
          coarseResult: result,
          refinementFactor: 4,
          corridorPaddingCells: 2,
          graphFactory: ({ bounds, width, height }) => buildGraph({ bounds, width, height }),
          solverFactory: (fineGraph) => buildSolver(fineGraph),
        });
        if (refinement.refined?.path) {
          const refinedQuality = measureRidgeAlignment(refinement.refined.path, ridgeAnalyzer);
          const resolution = comparePathResolution(result, refinement.refined);
          adaptiveDiagnostics.push({
            seed: seed.id,
            neighbour: neighbour.id,
            coarseQuality,
            refinedQuality,
            resolution,
          });
          assert.ok(refinement.width >= graph.width || refinement.height >= graph.height || refinement.bounds.maxLon - refinement.bounds.minLon < graph.bounds.maxLon - graph.bounds.minLon);
          assert.ok(Number.isFinite(refinedQuality.ridgeAlignmentScore));
        }
      } catch (error) {
        adaptiveDiagnostics.push({ seed: seed.id, neighbour: neighbour.id, refinement: "no-solution", reason: error.message });
      }
    }

    const registration = registerSolverPath(registry, { result, leftFace: `stress:${seed.id}`, rightFace: `stress:${neighbour.id}`, kind: "stress-edge", confidence: 0.5, nodeKind: "corner" });
    assert.ok(registration.arc);
    assert.ok(validateArcGeometry(registration.arc).valid);
  }
}

assert.ok(candidatePairs >= 20, `expected broad regional adjacency coverage, got ${candidatePairs}`);
assert.ok(solved >= Math.floor(candidatePairs * 0.75), `least-cost solver success rate too low: ${solved}/${candidatePairs}; diagnostics=${JSON.stringify(diagnostics.slice(0, 8))}`);
assert.ok(registry.nodes.size > 20, "authoritative registry should receive a regional node population");
assert.ok(registry.arcs.size > 15, "authoritative registry should receive a regional arc population");
assert.ok(adaptiveDiagnostics.some((entry) => entry.refinedQuality), "targeted adaptive refinement must produce at least one measurable refined path");

for (const arc of Object.values(registry.toTopology().arcs)) {
  assert.ok(arc.geometry.length >= 2);
  assert.notEqual(arc.startNode, arc.endNode);
  assert.ok(validateArcGeometry(arc).valid);
}

const sampleSeeds = [seeds[0], seeds[Math.floor(seeds.length / 2)], seeds.at(-1)];
const sampleNodes = sampleSeeds.map((seed) => nearestGraphNode(graph, seed));
const samples = sampleNodes.map((node) => demSampler.sample(node));
for (const sample of samples) {
  assert.ok(Object.values(sample).every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
}
const demCostSignatures = samples.map((sample) => `${sample.slope}:${sample.ridge}:${sample.mountain}`);
console.log(`Copernicus DEM quality probe: ${JSON.stringify(sampleSeeds.map((seed, index) => ({ id: seed.id, seed: seed.position, node: sampleNodes[index], dem: samples[index], signature: demCostSignatures[index] })))}`);
assert.ok(new Set(demCostSignatures).size > 1, `Copernicus DEM sampling must produce spatially varying terrain costs; probe=${JSON.stringify(sampleSeeds.map((seed, index) => ({ id: seed.id, node: sampleNodes[index], dem: samples[index] })))}`);

const ridgeSamples = sampleNodes.map((node) => ridgeAnalyzer.analyze(node));
assert.ok(ridgeSamples.every((sample) => sample.sampleCount >= 4));
assert.ok(ridgeSamples.every((sample) => sample.ridgeAffinity >= 0 && sample.ridgeAffinity <= 1));
assert.ok(new Set(ridgeSamples.map((sample) => sample.ridgeAffinity)).size > 1, "ridge/divide morphology must vary spatially");

const qualitySummary = adaptiveDiagnostics.filter((entry) => entry.refinedQuality);
console.log(`Anatolia seed + physical-cost + adaptive-ridge stress: PASS (${seeds.length} seeds, ${demSampler.entries.size} Copernicus tiles, ${candidatePairs} candidate pairs, ${solved} solved, ${failed} failed, ${registry.nodes.size} nodes, ${registry.arcs.size} arcs, ${MAJOR_RIVERS.length} major river segments, ${qualitySummary.length} adaptive refinements)`);
if (qualitySummary.length) console.log(`Ridge alignment metrics: ${JSON.stringify(qualitySummary.slice(0, 4))}`);