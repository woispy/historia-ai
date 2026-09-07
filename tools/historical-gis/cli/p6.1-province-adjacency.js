import { ANATOLIA_PHYSICAL_ATLAS } from "../../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../../src/map/data/AnatoliaProvinceMetadata.js";
import { buildP61Adjacency, formatP61Telemetry, summarizeP61Graph } from "../P61ProvinceAdjacency.js";

const graph = buildP61Adjacency(ANATOLIA_PROVINCE_METADATA, {
  landPolygons: ANATOLIA_PHYSICAL_ATLAS.landPolygons,
});
const summary = summarizeP61Graph(graph);

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
const longPhysicalMstEdges = graph.mstEdges
  .filter((edge) => edge.physicalReachable && edge.distanceKm >= 300)
  .map(({ from, to, distanceKm, reasons }) => ({
    from,
    to,
    distanceKm: Number(distanceKm.toFixed(3)),
    reasons,
  }));

// Always emit the diagnostic payload before any acceptance assertion so a
// failing candidate graph remains inspectable in CI.
console.log(formatP61Telemetry(summary));
console.log(`P6.1 mstConnected=${graph.mstConnected}`);
console.log(`P6.1 mstComponentCount=${components.length}`);
console.log(`P6.1 mstComponents=${JSON.stringify(components)}`);
console.log(`P6.1 longPhysicalMstEdges>=300km=${JSON.stringify(longPhysicalMstEdges)}`);
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
