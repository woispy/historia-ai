const EARTH_RADIUS_KM = 6371.0088;

export const T3_POINT_TYPES = Object.freeze({
  MANDATORY: "mandatory",
  SHAPE: "shape",
  CONSTRAINT: "constraint",
});

export const T3_DETAIL_LEVELS = Object.freeze({
  VERY_LOW: "very-low",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  VERY_HIGH: "very-high",
});

const DETAIL_PROFILES = Object.freeze({
  [T3_DETAIL_LEVELS.VERY_LOW]: { minPoints: 4, maxPoints: 8, targetSpacingKm: 80 },
  [T3_DETAIL_LEVELS.LOW]: { minPoints: 8, maxPoints: 16, targetSpacingKm: 45 },
  [T3_DETAIL_LEVELS.MEDIUM]: { minPoints: 16, maxPoints: 32, targetSpacingKm: 22 },
  [T3_DETAIL_LEVELS.HIGH]: { minPoints: 32, maxPoints: 64, targetSpacingKm: 10 },
  [T3_DETAIL_LEVELS.VERY_HIGH]: { minPoints: 64, maxPoints: 128, targetSpacingKm: 5 },
});

function finite(value, name) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

function point(value, name) {
  if (!Array.isArray(value) || value.length < 2) {
    throw new TypeError(`${name} must be [longitude, latitude]`);
  }
  return [finite(Number(value[0]), `${name}[0]`), finite(Number(value[1]), `${name}[1]`)];
}

function haversineKm(a, b) {
  const rad = Math.PI / 180;
  const lat1 = a[1] * rad;
  const lat2 = b[1] * rad;
  const dLat = lat2 - lat1;
  const dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function bearingDegrees(a, b) {
  const rad = Math.PI / 180;
  const lat1 = a[1] * rad;
  const lat2 = b[1] * rad;
  const dLon = (b[0] - a[0]) * rad;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2)
    - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function turnAngleDegrees(a, b, c) {
  const delta = Math.abs(bearingDegrees(a, b) - bearingDegrees(b, c));
  return Math.min(delta, 360 - delta);
}

function triangleAreaKm2(a, b, c) {
  const latitude = ((a[1] + b[1] + c[1]) / 3) * Math.PI / 180;
  const xScale = EARTH_RADIUS_KM * Math.cos(latitude) * Math.PI / 180;
  const yScale = EARTH_RADIUS_KM * Math.PI / 180;
  const ax = a[0] * xScale;
  const ay = a[1] * yScale;
  const bx = b[0] * xScale;
  const by = b[1] * yScale;
  const cx = c[0] * xScale;
  const cy = c[1] * yScale;
  return Math.abs((ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) / 2);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function normalizeDetailLevel(value) {
  if (Object.values(T3_DETAIL_LEVELS).includes(value)) return value;
  throw new RangeError(`Unsupported T3 source detail level: ${value}`);
}

export function deriveSourceDetailProfile(source = {}) {
  if (source.detailLevel) {
    const detailLevel = normalizeDetailLevel(source.detailLevel);
    return {
      detailLevel,
      ...DETAIL_PROFILES[detailLevel],
      derivation: "explicit",
    };
  }

  const scaleDenominator = Number(source.scaleDenominator);
  const pixelSizeMeters = Number(source.pixelSizeMeters);
  let score = 0;

  if (Number.isFinite(scaleDenominator)) {
    if (scaleDenominator <= 50_000) score += 4;
    else if (scaleDenominator <= 100_000) score += 3;
    else if (scaleDenominator <= 250_000) score += 2;
    else if (scaleDenominator <= 500_000) score += 1;
  }

  if (Number.isFinite(pixelSizeMeters)) {
    if (pixelSizeMeters <= 2) score += 4;
    else if (pixelSizeMeters <= 5) score += 3;
    else if (pixelSizeMeters <= 15) score += 2;
    else if (pixelSizeMeters <= 50) score += 1;
  }

  const detailLevel = score >= 7
    ? T3_DETAIL_LEVELS.VERY_HIGH
    : score >= 5
      ? T3_DETAIL_LEVELS.HIGH
      : score >= 3
        ? T3_DETAIL_LEVELS.MEDIUM
        : score >= 1
          ? T3_DETAIL_LEVELS.LOW
          : T3_DETAIL_LEVELS.VERY_LOW;

  return {
    detailLevel,
    ...DETAIL_PROFILES[detailLevel],
    derivation: "scale-and-resolution",
  };
}

function normalizeFeature(feature, index) {
  const geometry = (feature.geometry ?? []).map((p, pointIndex) => point(p, `features[${index}].geometry[${pointIndex}]`));
  if (geometry.length < 2) throw new RangeError(`features[${index}].geometry must contain at least two points`);
  return {
    id: String(feature.id ?? `feature_${index}`),
    geometry,
    class: String(feature.class ?? "UNKNOWN").toUpperCase(),
    sourceWeight: clamp01(Number.isFinite(Number(feature.sourceWeight)) ? Number(feature.sourceWeight) : 0.5),
    mandatoryIndices: new Set((feature.mandatoryIndices ?? []).map(Number)),
    constraintIndices: new Set((feature.constraintIndices ?? []).map(Number)),
  };
}

function localSinuosity(geometry, index) {
  if (index <= 0 || index >= geometry.length - 1) return 0;
  const a = geometry[index - 1];
  const b = geometry[index];
  const c = geometry[index + 1];
  const path = haversineKm(a, b) + haversineKm(b, c);
  const chord = Math.max(0.001, haversineKm(a, c));
  return clamp01((path / chord - 1) * 4);
}

function computeCandidate(feature, index, profile) {
  const geometry = feature.geometry;
  const current = geometry[index];
  const endpoint = index === 0 || index === geometry.length - 1;
  const mandatory = endpoint || feature.mandatoryIndices.has(index);
  const constraint = feature.constraintIndices.has(index);

  if (mandatory) {
    return {
      featureId: feature.id,
      sourceIndex: index,
      point: current,
      pointType: T3_POINT_TYPES.MANDATORY,
      importance: 1,
      components: { geometry: 1, historical: 1, topology: 1, source: 1, scale: 1 },
      locked: true,
    };
  }

  const previous = geometry[index - 1];
  const next = geometry[index + 1];
  const prevSegmentKm = haversineKm(previous, current);
  const nextSegmentKm = haversineKm(current, next);
  const localLengthKm = prevSegmentKm + nextSegmentKm;
  const angle = turnAngleDegrees(previous, current, next);
  const bendScore = clamp01(angle / 120);
  const area = triangleAreaKm2(previous, current, next);
  const effectiveAreaScore = clamp01(area / Math.max(1, profile.targetSpacingKm ** 2));
  const sinuosity = localSinuosity(geometry, index);
  const spacingPressure = clamp01(localLengthKm / Math.max(1, profile.targetSpacingKm));
  const geometryImportance = clamp01(
    bendScore * 0.42 + sinuosity * 0.28 + effectiveAreaScore * 0.2 + spacingPressure * 0.1,
  );
  const sourceImportance = feature.sourceWeight;
  const scaleImportance = clamp01(1 - profile.targetSpacingKm / 80);
  const topologyImportance = constraint ? 1 : 0;
  const historicalImportance = constraint ? 0.75 : 0;
  const importance = geometryImportance * 0.4
    + historicalImportance * 0.15
    + topologyImportance * 0.2
    + sourceImportance * 0.15
    + scaleImportance * 0.1;

  return {
    featureId: feature.id,
    sourceIndex: index,
    point: current,
    pointType: constraint ? T3_POINT_TYPES.CONSTRAINT : T3_POINT_TYPES.SHAPE,
    importance: Number(importance.toFixed(6)),
    components: {
      geometry: Number(geometryImportance.toFixed(6)),
      historical: Number(historicalImportance.toFixed(6)),
      topology: Number(topologyImportance.toFixed(6)),
      source: Number(sourceImportance.toFixed(6)),
      scale: Number(scaleImportance.toFixed(6)),
    },
    metrics: {
      bendDegrees: Number(angle.toFixed(3)),
      sinuosity: Number(sinuosity.toFixed(6)),
      effectiveAreaKm2: Number(area.toFixed(6)),
      localLengthKm: Number(localLengthKm.toFixed(3)),
    },
    locked: false,
  };
}

function dedupeBySourceIndex(candidates) {
  const map = new Map();
  for (const candidate of candidates) {
    const key = `${candidate.featureId}:${candidate.sourceIndex}`;
    const existing = map.get(key);
    if (!existing || candidate.importance > existing.importance) map.set(key, candidate);
  }
  return [...map.values()];
}

function selectAdaptiveCandidates(candidates, profile) {
  const locked = candidates.filter((candidate) => candidate.locked || candidate.pointType === T3_POINT_TYPES.CONSTRAINT);
  const optional = candidates
    .filter((candidate) => !candidate.locked && candidate.pointType !== T3_POINT_TYPES.CONSTRAINT)
    .sort((a, b) => b.importance - a.importance || a.sourceIndex - b.sourceIndex || a.featureId.localeCompare(b.featureId));

  const target = Math.max(profile.minPoints, Math.min(profile.maxPoints, Math.round(
    profile.minPoints + optional.length * 0.18,
  )));
  const selected = [...locked];
  const occupied = selected.map((candidate) => candidate.point);
  const minimumSpacingKm = Math.max(0.25, profile.targetSpacingKm * 0.22);

  for (const candidate of optional) {
    if (selected.length >= target) break;
    const tooClose = occupied.some((existing) => haversineKm(existing, candidate.point) < minimumSpacingKm);
    if (!tooClose || candidate.importance >= 0.8) {
      selected.push(candidate);
      occupied.push(candidate.point);
    }
  }

  if (selected.length < Math.min(profile.minPoints, candidates.length)) {
    for (const candidate of optional) {
      if (selected.includes(candidate)) continue;
      selected.push(candidate);
      if (selected.length >= Math.min(profile.minPoints, candidates.length)) break;
    }
  }

  return selected.sort((a, b) => a.sourceIndex - b.sourceIndex || a.featureId.localeCompare(b.featureId));
}

export function buildAdaptiveReferencePointGraph({
  source = {},
  features = [],
  anchors = [],
  constraints = [],
} = {}) {
  if (!Array.isArray(features) || features.length === 0) {
    throw new RangeError("T3 adaptive reference engine requires at least one source feature");
  }

  const profile = deriveSourceDetailProfile(source);
  const normalizedFeatures = features.map(normalizeFeature);
  const anchorMap = new Map(anchors.map((anchor, index) => {
    const normalized = point(anchor.point, `anchors[${index}].point`);
    return [String(anchor.id ?? `anchor_${index}`), {
      id: String(anchor.id ?? `anchor_${index}`),
      point: normalized,
      featureId: anchor.featureId ? String(anchor.featureId) : null,
      sourceIndex: Number.isInteger(anchor.sourceIndex) ? anchor.sourceIndex : null,
      confidence: anchor.confidence ?? "UNKNOWN",
    }];
  }));
  const constraintMap = new Map(constraints.map((constraint, index) => {
    const normalized = point(constraint.point, `constraints[${index}].point`);
    return [String(constraint.id ?? `constraint_${index}`), {
      id: String(constraint.id ?? `constraint_${index}`),
      point: normalized,
      featureId: constraint.featureId ? String(constraint.featureId) : null,
      sourceIndex: Number.isInteger(constraint.sourceIndex) ? constraint.sourceIndex : null,
      kind: constraint.kind ?? "UNKNOWN",
      confidence: constraint.confidence ?? "UNKNOWN",
    }];
  }));

  const candidates = normalizedFeatures.flatMap((feature) => (
    feature.geometry.map((_, index) => computeCandidate(feature, index, profile))
  ));

  for (const anchor of anchorMap.values()) {
    if (anchor.featureId && Number.isInteger(anchor.sourceIndex)) {
      const candidate = candidates.find((item) => item.featureId === anchor.featureId && item.sourceIndex === anchor.sourceIndex);
      if (candidate) {
        candidate.pointType = T3_POINT_TYPES.MANDATORY;
        candidate.locked = true;
        candidate.importance = 1;
        candidate.anchorId = anchor.id;
        candidate.anchorConfidence = anchor.confidence;
      }
    }
  }

  for (const constraint of constraintMap.values()) {
    if (constraint.featureId && Number.isInteger(constraint.sourceIndex)) {
      const candidate = candidates.find((item) => item.featureId === constraint.featureId && item.sourceIndex === constraint.sourceIndex);
      if (candidate && !candidate.locked) {
        candidate.pointType = T3_POINT_TYPES.CONSTRAINT;
        candidate.importance = Math.max(candidate.importance, 0.9);
        candidate.constraintId = constraint.id;
        candidate.constraintKind = constraint.kind;
        candidate.constraintConfidence = constraint.confidence;
      }
    }
  }

  const byFeature = normalizedFeatures.map((feature) => {
    const featureCandidates = dedupeBySourceIndex(candidates.filter((candidate) => candidate.featureId === feature.id));
    const selected = selectAdaptiveCandidates(featureCandidates, profile);
    return {
      featureId: feature.id,
      sourceClass: feature.class,
      sourcePointCount: feature.geometry.length,
      selectedPointCount: selected.length,
      points: selected,
    };
  });

  return {
    schemaVersion: 1,
    phase: "T3-C",
    engine: "EARG/ARPG",
    authoritative: false,
    status: "candidate",
    source: {
      id: source.id ?? "unknown",
      date: source.date ?? null,
      scaleDenominator: Number.isFinite(Number(source.scaleDenominator)) ? Number(source.scaleDenominator) : null,
      pixelSizeMeters: Number.isFinite(Number(source.pixelSizeMeters)) ? Number(source.pixelSizeMeters) : null,
      detailLevel: profile.detailLevel,
      detailDerivation: profile.derivation,
    },
    profile,
    semantics: {
      mandatoryPoints: "locked and retained across LOD simplification",
      shapePoints: "selected by deterministic geometry/source/scale importance",
      constraintPoints: "retained as topology or historical constraints",
      politicalTruth: "not inferred from geometry",
      canonicalTruth: "not produced by this engine",
    },
    anchors: [...anchorMap.values()],
    constraints: [...constraintMap.values()],
    features: byFeature,
  };
}

export function assertT3Candidate(result) {
  if (!result || result.phase !== "T3-C") throw new TypeError("Invalid T3-C reference point graph");
  if (result.authoritative !== false) throw new Error("T3-C candidate graph must never be authoritative");
  if (!result.profile?.detailLevel) throw new Error("T3-C result is missing source detail profile");
  if (!Array.isArray(result.features)) throw new Error("T3-C result is missing feature outputs");
  return true;
}
