import { ANATOLIA_PHYSICAL_ATLAS } from "../../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../../src/map/data/AnatoliaProvinceMetadata.js";
import { buildP61Adjacency, formatP61Telemetry, summarizeP61Graph } from "../P61ProvinceAdjacency.js";

const graph = buildP61Adjacency(ANATOLIA_PROVINCE_METADATA, {
  landPolygons: ANATOLIA_PHYSICAL_ATLAS.landPolygons,
});
const summary = summarizeP61Graph(graph);

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInLand(point, landPolygons) {
  return landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function buildComponents(seeds, edges) {
  const adjacency = new Map(seeds.map((seed) => [seed.id, []]));
  for (const edge of edges) {
    adjacency.get(edge.from)?.push(edge.to);
    adjacency.get(edge.to)?.push(edge.from);
  }

  const visited = new Set();
  const components = [];
  for (const seed of seeds) {
    if (visited.has(seed.id)) continue;
    const queue = [seed.id];
    const component = [];
    visited.add(seed.id);
    while (queue.length) {
      const id = queue.shift();
      component.push(id);
      for (const neighbor of adjacency.get(id) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
    components.push(component.sort());
  }
  return components.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
}

const components = buildComponents(graph.seeds, graph.mstEdges);
const outsideLandSeeds = graph.seeds
  .filter((seed) => !pointInLand(seed.point, ANATOLIA_PHYSICAL_ATLAS.landPolygons))
  .map(({ id, point }) => ({ id, point }));

// This is deliberately independent of the MST. A long physical corridor is
// diagnostic evidence about the coarse land atlas, not an adjacency rejection.
const longPhysicalCandidateEdges = summary.longPhysicalCandidateEdges;

// Every candidate edge must carry exactly one evidence class. This guards the
// provenance contract without claiming that any class is authoritative.
const evidenceClassCount = summary.historicalOnlyEdges.length
  + summary.physicalOnlyEdges.length
  + summary.dualEvidenceEdges.length;
const evidenceClassSet = new Set(graph.edges.map((edge) => edge.evidenceClass));
const expectedEvidenceClasses = new Set(["historical-only", "physical-only", "dual-evidence"]);
const evidenceClassesAreValid = evidenceClassSet.size === expectedEvidenceClasses.size
  && [...expectedEvidenceClasses].every((value) => evidenceClassSet.has(value))
  && evidenceClassCount === graph.edges.length;

// Always emit the diagnostic payload before any acceptance assertion so a
// failing candidate graph remains inspectable in CI.
console.log(formatP61Telemetry(summary));
console.log(`P6.1 mstConnected=${graph.mstConnected}`);
console.log(`P6.1 mstComponentCount=${components.length}`);
console.log(`P6.1 mstComponents=${JSON.stringify(components)}`);
console.log(`P6.1 seedPointsOutsideLandMask=${outsideLandSeeds.length}`);
console.log(`P6.1 seedPointsOutsideLandMaskDetails=${JSON.stringify(outsideLandSeeds)}`);
console.log(`P6.1 dataQualityDebt.outsideLandMaskSeedCount=${outsideLandSeeds.length}`);
console.log(`P6.1 dataQualityDebt.outsideLandMaskSeedIds=${JSON.stringify(outsideLandSeeds.map(({ id }) => id))}`);
console.log(`P6.1 longPhysicalCandidateEdges>=300km=${JSON.stringify(longPhysicalCandidateEdges)}`);
console.log(`P6.1 evidenceClassPartitionCount=${summary.evidenceClassPartitionCount}`);
console.log(`P6.1 evidenceClassesAreValid=${evidenceClassesAreValid}`);
console.log("P6.1 physicalReachable means land-corridor evidence only; it is not province boundary adjacency.");
console.log("P6.1 graph is a candidate/diagnostic graph; it is not yet authoritative province adjacency.");

if (summary.seedCount !== ANATOLIA_PROVINCE_METADATA.length) {
  throw new Error(`P6.1 seed count mismatch: expected ${ANATOLIA_PROVINCE_METADATA.length}, got ${summary.seedCount}`);
}
if (!graph.mstConnected) {
  throw new Error(`P6.1 physical candidate graph cannot connect all seeds; MST has ${summary.connectivityEdgeCount} of ${summary.seedCount - 1} required edges.`);
}
if (summary.isolatedSeedCount !== 0) {
  throw new Error(`P6.1 contains ${summary.isolatedSeedCount} isolated seeds.`);
}
if (!evidenceClassesAreValid) {
  throw new Error("P6.1 edge provenance classification is not an exhaustive three-class partition.");
}
