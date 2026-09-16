/**
 * Deterministic benchmark contract for candidate DEM evidence sampling.
 *
 * This measures logical evidence requests and underlying elevation requests
 * without depending on wall-clock timing or real Copernicus acquisition.
 */

export const DEM_SAMPLING_BENCHMARK_CONTRACT = Object.freeze({
  schemaVersion: 1,
  authoritative: false,
  profiles: Object.freeze({
    pilot: Object.freeze({ nodes: 4 }),
    regional: Object.freeze({ minNodes: 100, maxNodes: 1000 }),
    scale: Object.freeze({ minNodes: 15000 }),
  }),
  metrics: Object.freeze([
    "logicalRequests",
    "uniqueCoordinates",
    "cacheHits",
    "cacheMisses",
    "elevationRequests",
    "validSamples",
    "invalidSamples",
    "coverage",
  ]),
  timing: "not part of deterministic contract",
  politicalAuthority: false,
});

function finiteCoordinate(node) {
  return Number.isFinite(Number(node?.lon)) && Number.isFinite(Number(node?.lat));
}

export function runDEMSamplingBenchmark(provider, nodes) {
  if (!provider || typeof provider.sample !== "function" || typeof provider.getCacheStats !== "function") {
    throw new TypeError("provider must expose sample() and getCacheStats()");
  }
  if (!Array.isArray(nodes)) throw new TypeError("nodes must be an array");
  for (const node of nodes) if (!finiteCoordinate(node)) throw new TypeError("benchmark nodes require finite lon/lat");

  const uniqueCoordinates = new Set(nodes.map((node) => `${Number(node.lon)},${Number(node.lat)}`)).size;
  const results = nodes.map((node) => provider.sample(node));
  const stats = provider.getCacheStats();
  const validSamples = results.filter((result) => result.valid).length;
  const invalidSamples = results.length - validSamples;
  const coverage = results.length ? validSamples / results.length : 0;

  return Object.freeze({
    logicalRequests: nodes.length,
    uniqueCoordinates,
    cacheHits: stats.cacheHits,
    cacheMisses: stats.cacheMisses,
    elevationRequests: stats.elevationRequestCount,
    validSamples,
    invalidSamples,
    coverage: Number(coverage.toFixed(6)),
  });
}
