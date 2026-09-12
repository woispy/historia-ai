const DEFAULT_SAMPLE_STEP_KM = 10;
const DEFAULT_WEIGHTS = Object.freeze({
  ridge: 5,
  river: 3,
  hierarchy: 4,
  historical: 1,
  distance: 0.01,
});

export const P62_EVIDENCE_CLASSES = Object.freeze({
  RIDGE: "ridge",
  RIVER: "river",
  HIERARCHY: "hierarchy",
  HISTORICAL: "historical",
  MIXED: "mixed",
  NONE: "none",
});

export const P62_STATUS = Object.freeze({
  LOCKED: "locked",
  DIAGNOSTIC: "diagnostic",
  READY: "ready",
});

function assertFinite(value, name) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
}

function normalizePoint(point, name) {
  if (!Array.isArray(point) || point.length < 2) throw new TypeError(`${name} must be [longitude, latitude]`);
  const normalized = [Number(point[0]), Number(point[1])];
  assertFinite(normalized[0], `${name}[0]`);
  assertFinite(normalized[1], `${name}[1]`);
  return normalized;
}

function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLat = lat2 - lat1;
  const dLon = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function sampleGreatCircleLinear(a, b, stepKm) {
  const distanceKm = haversineKm(a, b);
  const steps = Math.max(1, Math.ceil(distanceKm / stepKm));
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  });
}

function minDistanceToLine(point, line) {
  let best = Number.POSITIVE_INFINITY;
  for (let index = 0; index < line.length - 1; index += 1) {
    const start = line[index];
    const end = line[index + 1];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const denominator = dx * dx + dy * dy;
    const t = denominator === 0
      ? 0
      : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
    const candidate = [start[0] + dx * t, start[1] + dy * t];
    best = Math.min(best, haversineKm(point, candidate));
  }
  return best;
}

function evidenceClass(features) {
  const classes = [];
  if (features.ridge) classes.push(P62_EVIDENCE_CLASSES.RIDGE);
  if (features.river) classes.push(P62_EVIDENCE_CLASSES.RIVER);
  if (features.hierarchy) classes.push(P62_EVIDENCE_CLASSES.HIERARCHY);
  if (features.historical) classes.push(P62_EVIDENCE_CLASSES.HISTORICAL);
  if (!classes.length) return P62_EVIDENCE_CLASSES.NONE;
  if (classes.length === 1) return classes[0];
  return P62_EVIDENCE_CLASSES.MIXED;
}

function normalizeLines(lines, name) {
  return (lines ?? []).map((line, index) => {
    if (!Array.isArray(line) || line.length < 2) throw new TypeError(`${name}[${index}] must contain at least two points`);
    return line.map((point, pointIndex) => normalizePoint(point, `${name}[${index}][${pointIndex}]`));
  });
}

function hasNearbyLine(point, lines, toleranceKm) {
  return lines.some((line) => minDistanceToLine(point, line) <= toleranceKm);
}

function normalizeHierarchy(hierarchy = {}) {
  return new Set(Object.entries(hierarchy)
    .filter(([, neighbors]) => Array.isArray(neighbors))
    .flatMap(([id, neighbors]) => neighbors.map((neighbor) => `${id}|${neighbor}`)));
}

export function createP62BoundaryEvidence({
  seeds = [],
  ridgeLines = [],
  riverLines = [],
  hierarchy = {},
  historicalAdjacency = {},
  elevationSampler = null,
  sampleStepKm = DEFAULT_SAMPLE_STEP_KM,
  ridgeToleranceKm = 25,
  riverToleranceKm = 15,
  weights = DEFAULT_WEIGHTS,
} = {}) {
  if (!Number.isFinite(sampleStepKm) || sampleStepKm <= 0) throw new RangeError("sampleStepKm must be > 0");
  if (!Number.isFinite(ridgeToleranceKm) || ridgeToleranceKm < 0) throw new RangeError("ridgeToleranceKm must be >= 0");
  if (!Number.isFinite(riverToleranceKm) || riverToleranceKm < 0) throw new RangeError("riverToleranceKm must be >= 0");

  const normalizedSeeds = seeds.map((seed) => ({
    id: String(seed.id),
    point: normalizePoint(seed.point, `seed ${seed.id}`),
  }));
  const normalizedRidges = normalizeLines(ridgeLines, "ridgeLines");
  const normalizedRivers = normalizeLines(riverLines, "riverLines");
  const hierarchyPairs = normalizeHierarchy(hierarchy);
  const historicalPairs = normalizeHierarchy(historicalAdjacency);

  const edges = [];
  for (let leftIndex = 0; leftIndex < normalizedSeeds.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < normalizedSeeds.length; rightIndex += 1) {
      const left = normalizedSeeds[leftIndex];
      const right = normalizedSeeds[rightIndex];
      const key = left.id < right.id ? `${left.id}|${right.id}` : `${right.id}|${left.id}`;
      const samples = sampleGreatCircleLinear(left.point, right.point, sampleStepKm);
      const ridge = samples.some((point) => hasNearbyLine(point, normalizedRidges, ridgeToleranceKm));
      const river = samples.some((point) => hasNearbyLine(point, normalizedRivers, riverToleranceKm));
      const hierarchyEvidence = hierarchyPairs.has(`${left.id}|${right.id}`)
        || hierarchyPairs.has(`${right.id}|${left.id}`);
      const historical = historicalPairs.has(`${left.id}|${right.id}`)
        || historicalPairs.has(`${right.id}|${left.id}`);

      let elevationRange = null;
      if (typeof elevationSampler === "function") {
        const elevations = samples.map((point) => Number(elevationSampler(point)));
        if (elevations.every(Number.isFinite)) {
          const min = Math.min(...elevations);
          const max = Math.max(...elevations);
          elevationRange = { min, max, relief: max - min };
        }
      }

      const score = (ridge ? weights.ridge : 0)
        + (river ? weights.river : 0)
        + (hierarchyEvidence ? weights.hierarchy : 0)
        + (historical ? weights.historical : 0)
        + haversineKm(left.point, right.point) * weights.distance;

      edges.push({
        key,
        from: left.id,
        to: right.id,
        distanceKm: Number(haversineKm(left.point, right.point).toFixed(3)),
        features: {
          ridge,
          river,
          hierarchy: hierarchyEvidence,
          historical,
          elevationRange,
        },
        evidenceClass: evidenceClass({ ridge, river, hierarchy: hierarchyEvidence, historical }),
        score: Number(score.toFixed(6)),
      });
    }
  }

  const sourceAvailability = {
    dem: typeof elevationSampler === "function",
    ridge: normalizedRidges.length > 0,
    river: normalizedRivers.length > 0,
    hierarchy: hierarchyPairs.size > 0,
    historical: historicalPairs.size > 0,
  };
  const physicalSourceCount = [sourceAvailability.dem, sourceAvailability.ridge, sourceAvailability.river].filter(Boolean).length;

  return {
    schemaVersion: 1,
    phase: "P6.2",
    authoritative: false,
    status: physicalSourceCount >= 2 ? P62_STATUS.DIAGNOSTIC : P62_STATUS.LOCKED,
    sourceAvailability,
    edges: edges.sort((a, b) => a.score - b.score || a.key.localeCompare(b.key)),
    algorithm: {
      sampleStepKm,
      ridgeToleranceKm,
      riverToleranceKm,
      weights: { ...weights },
      semantics: "boundary evidence scoring only; no edge is an authoritative province border",
    },
    lockReason: physicalSourceCount >= 2
      ? null
      : "P6.2 requires at least two independent physical evidence families; DEM/ridge/river source authority is not yet fully provisioned.",
  };
}

export function assertP62AuthoritativeReady(result) {
  if (!result || result.phase !== "P6.2") throw new TypeError("Invalid P6.2 result");
  if (!result.sourceAvailability.dem) throw new Error("P6.2 authoritative mode requires a DEM sampler");
  if (!result.sourceAvailability.ridge) throw new Error("P6.2 authoritative mode requires ridge evidence");
  if (!result.sourceAvailability.river) throw new Error("P6.2 authoritative mode requires river evidence");
  if (result.status !== P62_STATUS.READY || result.authoritative !== true) {
    throw new Error("P6.2 authoritative mode requires an explicitly READY authoritative result");
  }
  return true;
}
