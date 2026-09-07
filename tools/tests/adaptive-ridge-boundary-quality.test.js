import assert from "node:assert/strict";
import { appendFile, readFile } from "node:fs/promises";

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
assert.ok(HYDROGRAPHY.rivers.length > 0);
assert.ok(HYDROGRAPHY.lakes.length > 0);
assert.ok(MAJOR_RIVERS.length >= 3);

function distancePointToSegment(point, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point[0] - a[0], point[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
  return Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy));
}

function distanceToRivers(lon, lat) {
  let best = Infinity;
  for (const line of MAJOR_RIVERS) {
    for (let i = 1; i < line.length; i += 1) best = Math.min(best, distancePointToSegment([lon, lat], line[i - 1], line[i]));
  }
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

function pathLength(path) {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) total += Math.hypot(path[i].lon - path[i - 1].lon, path[i].lat - path[i - 1].lat);
  return total;
}

function endpointDisplacement(coarsePath, refinedPath) {
  if (!coarsePath.length || !refinedPath.length) return null;
  const start = Math.hypot(coarsePath[0].lon - refinedPath[0].lon, coarsePath[0].lat - refinedPath[0].lat);
  const end = Math.hypot(coarsePath.at(-1).lon - refinedPath.at(-1).lon, coarsePath.at(-1).lat - refinedPath.at(-1).lat);
  return Math.max(start, end);
}

const seeds = makeSeeds();
assert.equal(seeds.length, ANATOLIA_PROVINCE_METADATA.length);
assert.ok(seeds.length >= 30);

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
const pairs = [];

for (const seed of seeds) {
  const neighbours = index.queryRadius(seed.position.lon, seed.position.lat, 2.25)
    .filter((candidate) => candidate.id !== seed.id)
    .slice(0, 2);
  for (const neighbour of neighbours) {
    if (seed.id.localeCompare(neighbour.id) >= 0) continue;
    const start = nearestGraphNode(graph, seed);
    const end = nearestGraphNode(graph, neighbour);
    const result = solver.solve({ start, end });
    if (!result.path) continue;

    const coarseQuality = measureRidgeAlignment(result.path, ridgeAnalyzer);
    let refinement;
    try {
      refinement = refineLeastCostPath({
        coarseGraph: graph,
        coarseResult: result,
        refinementFactor: 4,
        corridorPaddingCells: 2,
        graphFactory: ({ bounds, width, height }) => buildGraph({ bounds, width, height }),
        solverFactory: (fineGraph) => buildSolver(fineGraph),
      });
    } catch (error) {
      refinement = { error: error.message };
    }

    const refinedPath = refinement?.refined?.path ?? null;
    const refinedQuality = refinedPath ? measureRidgeAlignment(refinedPath, ridgeAnalyzer) : null;
    const resolution = refinedPath ? comparePathResolution(result, refinement.refined) : null;
    const riverDistances = result.path.map((node) => distanceToRivers(node.lon, node.lat)).filter(Number.isFinite);
    const physical = result.path.map((node) => physicalSample(node));

    pairs.push({
      seed: seed.id,
      neighbour: neighbour.id,
      coarse: {
        nodes: result.path.length,
        lengthDegrees: pathLength(result.path),
        cost: result.cost,
        ridge: coarseQuality,
      },
      refined: refinedPath ? {
        nodes: refinedPath.length,
        lengthDegrees: pathLength(refinedPath),
        cost: refinement.refined.cost,
        ridge: refinedQuality,
      } : null,
      resolution,
      pathStability: refinedPath ? {
        endpointDisplacementDegrees: endpointDisplacement(result.path, refinedPath),
        pathLengthDeltaDegrees: pathLength(refinedPath) - pathLength(result.path),
        corridor: { minLon: refinement.bounds.minLon, maxLon: refinement.bounds.maxLon, minLat: refinement.bounds.minLat, maxLat: refinement.bounds.maxLat },
      } : { refinementError: refinement?.error ?? "no refined path" },
      physicalAlignment: {
        ridgeAffinityMean: physical.reduce((sum, sample) => sum + (1 - sample.ridge), 0) / physical.length,
        riverProximityMeanDegrees: riverDistances.length ? riverDistances.reduce((sum, value) => sum + value, 0) / riverDistances.length : null,
        mountainResistanceMean: physical.reduce((sum, sample) => sum + sample.mountain, 0) / physical.length,
      },
      degenerate: result.path.length < 2 || (refinedPath != null && refinedPath.length < 2),
    });
  }
}

assert.ok(pairs.length >= 20, `adaptive ridge baseline requires >=20 successful path pairs, got ${pairs.length}`);
assert.ok(pairs.every((entry) => Number.isFinite(entry.coarse.ridge.ridgeAlignmentScore)));
assert.ok(pairs.some((entry) => entry.refined), "adaptive ridge baseline requires at least one refined path");

const refinedPairs = pairs.filter((entry) => entry.refined);
const allRidgeScores = refinedPairs.map((entry) => entry.refined.ridge.ridgeAlignmentScore).sort((a, b) => a - b);
const percentile = (values, p) => values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))];
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const degeneratePathRatio = pairs.filter((entry) => entry.degenerate).length / pairs.length;

const baseline = {
  samplePairs: pairs.length,
  refinedPairs: refinedPairs.length,
  coarseVsRefined: {
    nodeDensityMultiplierMean: mean(refinedPairs.map((entry) => entry.resolution.nodeDensityMultiplier)),
    costDeltaMean: mean(refinedPairs.map((entry) => entry.resolution.costDelta)),
    costDeltaP10: percentile(refinedPairs.map((entry) => entry.resolution.costDelta).sort((a, b) => a - b), 0.10),
    costDeltaP50: percentile(refinedPairs.map((entry) => entry.resolution.costDelta).sort((a, b) => a - b), 0.50),
    costDeltaP90: percentile(refinedPairs.map((entry) => entry.resolution.costDelta).sort((a, b) => a - b), 0.90),
  },
  ridgeAlignment: {
    mean: mean(allRidgeScores),
    P10: percentile(allRidgeScores, 0.10),
    P50: percentile(allRidgeScores, 0.50),
    P90: percentile(allRidgeScores, 0.90),
  },
  pathStability: {
    endpointDisplacementMeanDegrees: mean(refinedPairs.map((entry) => entry.pathStability.endpointDisplacementDegrees)),
    endpointDisplacementP90Degrees: percentile(refinedPairs.map((entry) => entry.pathStability.endpointDisplacementDegrees).sort((a, b) => a - b), 0.90),
    pathLengthDeltaMeanDegrees: mean(refinedPairs.map((entry) => entry.pathStability.pathLengthDeltaDegrees)),
  },
  degeneratePathRatio,
  physicalAlignment: {
    ridgeAffinityMean: mean(refinedPairs.map((entry) => entry.physicalAlignment.ridgeAffinityMean)),
    riverProximityMeanDegrees: mean(refinedPairs.map((entry) => entry.physicalAlignment.riverProximityMeanDegrees).filter(Number.isFinite)),
    mountainResistanceMean: mean(refinedPairs.map((entry) => entry.physicalAlignment.mountainResistanceMean)),
  },
};

console.log(`ADAPTIVE_RIDGE_BASELINE_TELEMETRY ${JSON.stringify(baseline)}`);
console.log(`ADAPTIVE_RIDGE_BASELINE_SAMPLES ${JSON.stringify(pairs)}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    "## Adaptive Ridge Baseline Telemetry",
    "",
    "| Metric | Value |",
    "|---|---:|",
    `| Sample pairs | ${baseline.samplePairs} |`,
    `| Refined pairs | ${baseline.refinedPairs} |`,
    `| Node density multiplier mean | ${baseline.coarseVsRefined.nodeDensityMultiplierMean} |`,
    `| Cost delta P10 / P50 / P90 | ${baseline.coarseVsRefined.costDeltaP10} / ${baseline.coarseVsRefined.costDeltaP50} / ${baseline.coarseVsRefined.costDeltaP90} |`,
    `| Ridge alignment mean | ${baseline.ridgeAlignment.mean} |`,
    `| Ridge alignment P10 / P50 / P90 | ${baseline.ridgeAlignment.P10} / ${baseline.ridgeAlignment.P50} / ${baseline.ridgeAlignment.P90} |`,
    `| Endpoint displacement mean / P90 (deg) | ${baseline.pathStability.endpointDisplacementMeanDegrees} / ${baseline.pathStability.endpointDisplacementP90Degrees} |`,
    `| Path length delta mean (deg) | ${baseline.pathStability.pathLengthDeltaMeanDegrees} |`,
    `| Degenerate path ratio | ${baseline.degeneratePathRatio} |`,
    `| Ridge cost inverse mean | ${baseline.physicalAlignment.ridgeAffinityMean} |`,
    `| River proximity mean (deg) | ${baseline.physicalAlignment.riverProximityMeanDegrees} |`,
    `| Mountain resistance mean | ${baseline.physicalAlignment.mountainResistanceMean} |`,
    "",
    "Baseline only: no quality thresholds are applied.",
  ];
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`, "utf8");
}

// Baseline phase deliberately has no quality thresholds. Thresholds are added only
// after this telemetry has been reviewed and converted into an explicit contract.
