import { ANATOLIA_ADJACENCY_HINTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const EARTH_RADIUS_KM = 6371.0088;
const LOCAL_NEIGHBOR_COUNT = 6;
const HISTORICAL_HINT_REASON = "historical-adjacency-hint";
const HISTORICAL_PARENT_LOCAL_REASON = "historical-parent-local";
const EVIDENCE_CLASSES = Object.freeze({
  HISTORICAL_ONLY: "historical-only",
  PHYSICAL_ONLY: "physical-only",
  DUAL: "dual-evidence",
});

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

function classifyEvidence(edge) {
  const reasons = edge.reasons instanceof Set ? edge.reasons : new Set(edge.reasons ?? []);
  const hasHistoricalEvidence = reasons.has(HISTORICAL_HINT_REASON)
    || reasons.has(HISTORICAL_PARENT_LOCAL_REASON);
  if (hasHistoricalEvidence && edge.physicalReachable) return EVIDENCE_CLASSES.DUAL;
  if (hasHistoricalEvidence) return EVIDENCE_CLASSES.HISTORICAL_ONLY;
  return EVIDENCE_CLASSES.PHYSICAL_ONLY;
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
      if (item.candidate.parentId === seed.parentId) add(seed, item.candidate, HISTORICAL_PARENT_LOCAL_REASON);
      else if (segmentIsLandReachable(seed.point, item.candidate.point, landPolygons)) add(seed, item.candidate, "physical-local");
    }

    const nearestPhysical = nearest.find((item) => segmentIsLandReachable(seed.point, item.candidate.point, landPolygons));
    if (nearestPhysical) add(seed, nearestPhysical.candidate, "physical-nearest");
  }

  return [...edgeMap.values()]
    .map((edge) => {
      const reasons = [...edge.reasons].sort();
      return {
        ...edge,
        reasons,
        evidenceClass: classifyEvidence({ ...edge, reasons }),
      };
    })
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
    .filter((edge) => edge.physicalReachable || edge.reasons.includes(HISTORICAL_HINT_REASON) || edge.reasons.includes(HISTORICAL_PARENT_LOCAL_REASON))
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

function edgeView(edge) {
  return {
    key: edge.key,
    from: edge.from,
    to: edge.to,
    distanceKm: Number(edge.distanceKm.toFixed(3)),
    reasons: edge.reasons,
    evidenceClass: edge.evidenceClass,
    physicalReachable: edge.physicalReachable,
  };
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
    schemaVersion: 3,
    phase: "P6.1",
    authoritative: false,
    seeds,
    edges,
    mstEdges,
    mstConnected: mstEdges.length === Math.max(0, seeds.length - 1),
    algorithm: {
      localNeighborCount: LOCAL_NEIGHBOR_COUNT,
      localSelection: "six-nearest historical/physical candidates per seed",
      historicalEvidence: "existing ANATOLIA_ADJACENCY_HINTS retained as non-authoritative candidate evidence; same-parent local candidates are historical-parent-local evidence",
      physicalReachability: "corridor evidence only: great-circle distance with sampled straight geographic segment; land atlas only; not province boundary adjacency",
      evidenceClassification: "historical-only, physical-only, or dual-evidence; historical evidence family includes historical-adjacency-hint and historical-parent-local; exhaustive and mutually exclusive per candidate edge",
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
  const degreeBySeed = new Map(graph.seeds.map((seed) => [seed.id, 0]));
  for (const edge of graph.edges) {
    degreeBySeed.set(edge.from, (degreeBySeed.get(edge.from) ?? 0) + 1);
    degreeBySeed.set(edge.to, (degreeBySeed.get(edge.to) ?? 0) + 1);
  }
  const degrees = [...degreeBySeed.values()];
  const distances = graph.edges.map((edge) => edge.distanceKm);
  const physicalDistances = graph.edges
    .filter((edge) => edge.physicalReachable)
    .map((edge) => edge.distanceKm);
  const historicalOnlyEdges = graph.edges.filter((edge) => edge.evidenceClass === EVIDENCE_CLASSES.HISTORICAL_ONLY).map(edgeView);
  const physicalOnlyEdges = graph.edges.filter((edge) => edge.evidenceClass === EVIDENCE_CLASSES.PHYSICAL_ONLY).map(edgeView);
  const dualEvidenceEdges = graph.edges.filter((edge) => edge.evidenceClass === EVIDENCE_CLASSES.DUAL).map(edgeView);
  const longPhysicalCandidateEdges = graph.edges
    .filter((edge) => edge.physicalReachable && edge.distanceKm >= 300)
    .map(edgeView);

  return {
    schemaVersion: graph.schemaVersion,
    phase: graph.phase,
    authoritative: graph.authoritative,
    seedCount: graph.seeds.length,
    edgeCount: graph.edges.length,
    connectivityEdgeCount: graph.mstEdges.length,
    isolatedSeedCount: degrees.filter((degree) => degree === 0).length,
    degreeMin: degrees.length ? Math.min(...degrees) : 0,
    degreeMedian: percentile(degrees, 0.5),
    degreeP90: percentile(degrees, 0.9),
    degreeMax: degrees.length ? Math.max(...degrees) : 0,
    minDistanceKm: distances.length ? Math.min(...distances) : 0,
    medianDistanceKm: percentile(distances, 0.5),
    p90DistanceKm: percentile(distances, 0.9),
    maxDistanceKm: distances.length ? Math.max(...distances) : 0,
    physicallyReachableEdgeCount: physicalDistances.length,
    historicalHintEdgeCount: graph.edges.filter((edge) => edge.reasons.includes(HISTORICAL_HINT_REASON)).length,
    historicalParentLocalEdgeCount: graph.edges.filter((edge) => edge.reasons.includes(HISTORICAL_PARENT_LOCAL_REASON)).length,
    historicalOnlyEdgeCount: historicalOnlyEdges.length,
    physicalOnlyEdgeCount: physicalOnlyEdges.length,
    dualEvidenceEdgeCount: dualEvidenceEdges.length,
    evidenceClassPartitionCount: historicalOnlyEdges.length + physicalOnlyEdges.length + dualEvidenceEdges.length,
    historicalOnlyEdges,
    physicalOnlyEdges,
    dualEvidenceEdges,
    longPhysicalCandidateEdgeCount: longPhysicalCandidateEdges.length,
    longPhysicalCandidateEdges,
  };
}

export function formatP61Telemetry(summary) {
  const lines = [
    `P6.1 seedCount=${summary.seedCount}`,
    `P6.1 edgeCount=${summary.edgeCount}`,
    `P6.1 connectivityEdgeCount=${summary.connectivityEdgeCount}`,
    `P6.1 isolatedSeedCount=${summary.isolatedSeedCount}`,
    `P6.1 degreeMin=${summary.degreeMin}`,
    `P6.1 degreeMedian=${Number(summary.degreeMedian.toFixed(3))}`,
    `P6.1 degreeP90=${Number(summary.degreeP90.toFixed(3))}`,
    `P6.1 degreeMax=${summary.degreeMax}`,
    `P6.1 minDistanceKm=${Number(summary.minDistanceKm.toFixed(3))}`,
    `P6.1 medianDistanceKm=${Number(summary.medianDistanceKm.toFixed(3))}`,
    `P6.1 p90DistanceKm=${Number(summary.p90DistanceKm.toFixed(3))}`,
    `P6.1 maxDistanceKm=${Number(summary.maxDistanceKm.toFixed(3))}`,
    `P6.1 physicallyReachableEdgeCount=${summary.physicallyReachableEdgeCount}`,
    `P6.1 historicalHintEdgeCount=${summary.historicalHintEdgeCount}`,
    `P6.1 historicalParentLocalEdgeCount=${summary.historicalParentLocalEdgeCount}`,
    `P6.1 historicalOnlyEdgeCount=${summary.historicalOnlyEdgeCount}`,
    `P6.1 physicalOnlyEdgeCount=${summary.physicalOnlyEdgeCount}`,
    `P6.1 dualEvidenceEdgeCount=${summary.dualEvidenceEdgeCount}`,
    `P6.1 evidenceClassPartitionCount=${summary.evidenceClassPartitionCount}`,
    `P6.1 longPhysicalCandidateEdgeCount=${summary.longPhysicalCandidateEdgeCount}`,
    `P6.1 longPhysicalCandidateEdges=${JSON.stringify(summary.longPhysicalCandidateEdges)}`,
  ];
  return lines.join("\n");
}
