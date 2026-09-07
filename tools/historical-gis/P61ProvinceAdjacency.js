import { ANATOLIA_ADJACENCY_HINTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const EARTH_RADIUS_KM = 6371.0088;
const LOCAL_NEIGHBOR_COUNT = 6;
const HISTORICAL_HINT_REASON = "historical-adjacency-hint";

function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLat = lat2 - lat1;
  const dLon = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

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

function segmentIsLandReachable(a, b, landPolygons) {
  const distance = haversineKm(a, b);
  const steps = Math.max(2, Math.ceil(distance / 5));
  for (let index = 1; index < steps; index += 1) {
    const t = index / steps;
    const point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    if (!pointInLand(point, landPolygons)) return false;
  }
  return true;
}

function normalizeMetadata(metadata) {
  return metadata
    .filter((item) => item?.id && Array.isArray(item.centroid) && item.centroid.length >= 2)
    .map((item) => ({
      id: item.id,
      parentId: item.regionId ?? null,
      point: [Number(item.centroid[0]), Number(item.centroid[1])],
    }));
}

function pairKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function buildCandidates(seeds, landPolygons, adjacencyHints) {
  const edgeMap = new Map();
  const add = (left, right, reason) => {
    if (left.id === right.id) return;
    const key = pairKey(left.id, right.id);
    const existing = edgeMap.get(key);
    const edge = existing ?? {
      key,
      from: left.id < right.id ? left.id : right.id,
      to: left.id < right.id ? right.id : left.id,
      fromParentId: left.id < right.id ? left.parentId : right.parentId,
      toParentId: left.id < right.id ? right.parentId : left.parentId,
      distanceKm: haversineKm(left.point, right.point),
      physicalReachable: segmentIsLandReachable(left.point, right.point, landPolygons),
      reasons: new Set(),
    };
    edge.reasons.add(reason);
    edgeMap.set(key, edge);
  };

  const seedById = new Map(seeds.map((seed) => [seed.id, seed]));

  // Existing historical adjacency hints are evidence, not authoritative
  // topology. They are deliberately retained as a separate reason so later
  // phases can score, challenge, or replace them with source-derived borders.
  for (const [seedId, neighborIds] of Object.entries(adjacencyHints)) {
    const seed = seedById.get(seedId);
    if (!seed) continue;
    for (const neighborId of neighborIds) {
      const neighbor = seedById.get(neighborId);
      if (neighbor) add(seed, neighbor, HISTORICAL_HINT_REASON);
    }
  }

  for (const seed of seeds) {
    const nearest = seeds
      .filter((candidate) => candidate.id !== seed.id)
      .map((candidate) => ({ candidate, distanceKm: haversineKm(seed.point, candidate.point) }))
      .sort((a, b) => a.distanceKm - b.distanceKm || a.candidate.id.localeCompare(b.candidate.id));

    for (const item of nearest.slice(0, LOCAL_NEIGHBOR_COUNT)) {
      if (item.candidate.parentId === seed.parentId) add(seed, item.candidate, "historical-parent-local");
      else if (segmentIsLandReachable(seed.point, item.candidate.point, landPolygons)) add(seed, item.candidate, "physical-local");
    }

    const nearestPhysical = nearest.find((item) => segmentIsLandReachable(seed.point, item.candidate.point, landPolygons));
    if (nearestPhysical) add(seed, nearestPhysical.candidate, "physical-nearest");
  }

  return [...edgeMap.values()]
    .map((edge) => ({ ...edge, reasons: [...edge.reasons].sort() }))
    .sort((a, b) => a.distanceKm - b.distanceKm || a.key.localeCompare(b.key));
}

function buildMst(seeds, edges) {
  const parent = new Map(seeds.map((seed) => [seed.id, seed.id]));
  const find = (id) => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root);
    while (parent.get(id) !== id) {
      const next = parent.get(id);
      parent.set(id, root);
      id = next;
    }
    return root;
  };
  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA === rootB) return false;
    parent.set(rootB, rootA);
    return true;
  };

  const mst = [];
  const connectivityEdges = edges
    .filter((edge) => edge.physicalReachable || edge.reasons.includes(HISTORICAL_HINT_REASON))
    .sort((a, b) => a.distanceKm - b.distanceKm || a.key.localeCompare(b.key));

  for (const edge of connectivityEdges) {
    if (union(edge.from, edge.to)) mst.push({ ...edge, mst: true });
    if (mst.length === Math.max(0, seeds.length - 1)) break;
  }
  return mst;
}

function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function buildP61Adjacency(metadata, {
  landPolygons = [],
  adjacencyHints = ANATOLIA_ADJACENCY_HINTS,
} = {}) {
  const seeds = normalizeMetadata(metadata);
  const edges = buildCandidates(seeds, landPolygons, adjacencyHints);
  const mstEdges = buildMst(seeds, edges);
  const mstKeys = new Set(mstEdges.map((edge) => edge.key));

  return {
    schemaVersion: 2,
    phase: "P6.1",
    authoritative: false,
    seeds,
    edges,
    mstEdges,
    mstConnected: mstEdges.length === Math.max(0, seeds.length - 1),
    algorithm: {
      localNeighborCount: LOCAL_NEIGHBOR_COUNT,
      localSelection: "six-nearest historical/physical candidates per seed",
      historicalEvidence: "existing ANATOLIA_ADJACENCY_HINTS retained as non-authoritative candidate evidence",
      physicalReachability: "great-circle distance with sampled straight geographic segment; land atlas only",
      mst: "Kruskal over physical or explicit historical candidate edges; diagnostic/connectivity fallback only",
      fixedMaxDistanceKm: null,
    },
    diagnostics: {
      mstArtificialJumpKeys: mstEdges.filter((edge) => edge.distanceKm > percentile(mstEdges.map((item) => item.distanceKm), 0.9)).map((edge) => edge.key),
      nonMstEdgeKeys: edges.filter((edge) => !mstKeys.has(edge.key)).map((edge) => edge.key),
    },
  };
}

export function summarizeP61Graph(graph) {
  const edges = graph?.edges ?? [];
  const seeds = graph?.seeds ?? [];
  const distances = edges.map((edge) => edge.distanceKm);
  const degrees = new Map(seeds.map((seed) => [seed.id, 0]));
  for (const edge of edges) {
    degrees.set(edge.from, (degrees.get(edge.from) ?? 0) + 1);
    degrees.set(edge.to, (degrees.get(edge.to) ?? 0) + 1);
  }
  const degreeValues = [...degrees.values()];
  const sameParentEdgeCount = edges.filter((edge) => edge.fromParentId && edge.fromParentId === edge.toParentId).length;
  const crossParentEdgeCount = edges.length - sameParentEdgeCount;
  const physicallyReachable = edges.filter((edge) => edge.physicalReachable);
  const historicalHintEdges = edges.filter((edge) => edge.reasons.includes(HISTORICAL_HINT_REASON));
  const suspiciousEdges = edges.filter((edge) => !edge.physicalReachable);
  const longestEdges = [...edges].sort((a, b) => b.distanceKm - a.distanceKm || a.key.localeCompare(b.key)).slice(0, 10);
  const mstDistances = (graph?.mstEdges ?? []).map((edge) => edge.distanceKm);

  return {
    seedCount: seeds.length,
    edgeCount: edges.length,
    localEdgeCount: edges.filter((edge) => edge.reasons.some((reason) => reason.endsWith("local"))).length,
    connectivityEdgeCount: graph?.mstEdges?.length ?? 0,
    sameParentEdgeCount,
    crossParentEdgeCount,
    historicalHintEdgeCount: historicalHintEdges.length,
    historicalHintOnlyEdgeCount: historicalHintEdges.filter((edge) => !edge.physicalReachable).length,
    minDistance: distances.length ? Math.min(...distances) : 0,
    medianDistance: percentile(distances, 0.5),
    p90Distance: percentile(distances, 0.9),
    maxDistance: distances.length ? Math.max(...distances) : 0,
    degreeMin: degreeValues.length ? Math.min(...degreeValues) : 0,
    degreeMedian: percentile(degreeValues, 0.5),
    degreeP90: percentile(degreeValues, 0.9),
    degreeMax: degreeValues.length ? Math.max(...degreeValues) : 0,
    isolatedSeedCount: degreeValues.filter((degree) => degree === 0).length,
    physicallyReachableEdgeCount: physicallyReachable.length,
    suspiciousEdgeCount: suspiciousEdges.length,
    suspiciousEdges: suspiciousEdges.slice(0, 20),
    mstEdges: graph?.mstEdges ?? [],
    longestEdges,
    mstMinDistance: mstDistances.length ? Math.min(...mstDistances) : 0,
    mstMedianDistance: percentile(mstDistances, 0.5),
    mstP90Distance: percentile(mstDistances, 0.9),
    mstMaxDistance: mstDistances.length ? Math.max(...mstDistances) : 0,
  };
}

export function formatP61Telemetry(summary) {
  return [
    `P6.1 seedCount=${summary.seedCount}`,
    `P6.1 edgeCount=${summary.edgeCount}`,
    `P6.1 localEdgeCount=${summary.localEdgeCount}`,
    `P6.1 connectivityEdgeCount=${summary.connectivityEdgeCount}`,
    `P6.1 sameParentEdgeCount=${summary.sameParentEdgeCount}`,
    `P6.1 crossParentEdgeCount=${summary.crossParentEdgeCount}`,
    `P6.1 historicalHintEdgeCount=${summary.historicalHintEdgeCount}`,
    `P6.1 historicalHintOnlyEdgeCount=${summary.historicalHintOnlyEdgeCount}`,
    `P6.1 distanceKm min=${summary.minDistance.toFixed(3)} median=${summary.medianDistance.toFixed(3)} p90=${summary.p90Distance.toFixed(3)} max=${summary.maxDistance.toFixed(3)}`,
    `P6.1 degree min=${summary.degreeMin} median=${summary.degreeMedian.toFixed(3)} p90=${summary.degreeP90.toFixed(3)} max=${summary.degreeMax} isolated=${summary.isolatedSeedCount}`,
    `P6.1 suspiciousEdges=${summary.suspiciousEdgeCount}`,
    `P6.1 mstEdges=${JSON.stringify(summary.mstEdges.map(({ from, to, distanceKm, reasons }) => ({ from, to, distanceKm: Number(distanceKm.toFixed(3)), reasons })))}`,
    `P6.1 longestEdges=${JSON.stringify(summary.longestEdges.map(({ from, to, distanceKm, reasons, physicalReachable }) => ({ from, to, distanceKm: Number(distanceKm.toFixed(3)), reasons, physicalReachable })))}`,
  ].join("\n");
}
