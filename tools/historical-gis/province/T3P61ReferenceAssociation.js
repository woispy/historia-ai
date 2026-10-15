import { greatCircleDistanceKm } from "./ProvinceAdjacencyGraph.js";

const DEFAULT_RADIUS_KM = 35;

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${name} must be finite`);
  return number;
}

function point(value, name) {
  if (!Array.isArray(value) || value.length < 2) throw new TypeError(`${name} must be [longitude, latitude]`);
  return { lon: finite(value[0], `${name}[0]`), lat: finite(value[1], `${name}[1]`) };
}

function distanceToPoint(reference, node) {
  return greatCircleDistanceKm(reference, node.position);
}

function distanceToSegmentApprox(reference, a, b, steps = 16) {
  let best = Infinity;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const candidate = {
      lon: a.position.lon + (b.position.lon - a.position.lon) * t,
      lat: a.position.lat + (b.position.lat - a.position.lat) * t,
    };
    best = Math.min(best, greatCircleDistanceKm(reference, candidate));
  }
  return best;
}

function flattenT3Points(t3Result) {
  const points = [];
  for (const feature of t3Result?.features ?? []) {
    for (const item of feature.points ?? []) {
      points.push({
        id: `${feature.featureId}:${item.sourceIndex}`,
        featureId: feature.featureId,
        sourceIndex: item.sourceIndex,
        point: point(item.point, `features.${feature.featureId}.points.${item.sourceIndex}`),
        pointType: item.pointType,
        importance: Number(item.importance) || 0,
        locked: item.locked === true,
        anchorId: item.anchorId ?? null,
        constraintId: item.constraintId ?? null,
      });
    }
  }
  return points.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * T3-D: associates EARG reference points with the existing P6.1 candidate graph.
 * This is an evidence/association layer only. It never creates authoritative
 * political borders and never mutates P6.1 nodes or edges.
 */
export function associateT3ReferencePointsWithP61(t3Result, adjacencyGraph, { radiusKm = DEFAULT_RADIUS_KM } = {}) {
  if (t3Result?.phase !== "T3-C" || t3Result?.authoritative !== false) {
    throw new Error("T3-D requires a non-authoritative T3-C result");
  }
  if (!adjacencyGraph || adjacencyGraph.authoritative !== false) {
    throw new Error("T3-D requires a non-authoritative P6.1 graph");
  }
  finite(radiusKm, "radiusKm");
  if (radiusKm <= 0) throw new RangeError("radiusKm must be positive");

  const nodes = new Map(adjacencyGraph.nodes.map((node) => [node.id, node]));
  const points = flattenT3Points(t3Result);
  const pointAssociations = points.map((reference) => {
    const nearest = [...nodes.values()]
      .map((node) => ({ node, distanceKm: distanceToPoint(reference.point, node) }))
      .sort((a, b) => a.distanceKm - b.distanceKm || a.node.id.localeCompare(b.node.id))[0] ?? null;
    return {
      referencePointId: reference.id,
      featureId: reference.featureId,
      sourceIndex: reference.sourceIndex,
      pointType: reference.pointType,
      importance: reference.importance,
      locked: reference.locked,
      anchorId: reference.anchorId,
      constraintId: reference.constraintId,
      nearestNodeId: nearest?.node.id ?? null,
      nearestNodeDistanceKm: nearest ? Number(nearest.distanceKm.toFixed(6)) : null,
      withinAssociationRadius: Boolean(nearest && nearest.distanceKm <= radiusKm),
    };
  });

  const edgeAssociations = adjacencyGraph.edges.map((edge) => {
    const source = nodes.get(edge.source);
    const target = nodes.get(edge.target);
    const nearby = points
      .map((reference) => ({ reference, distanceKm: distanceToSegmentApprox(reference.point, source, target) }))
      .filter((item) => item.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm || a.reference.id.localeCompare(b.reference.id));
    return {
      edgeId: edge.id,
      source: edge.source,
      target: edge.target,
      candidateOnly: true,
      referencePointCount: nearby.length,
      referencePointIds: nearby.map((item) => item.reference.id),
      nearestReferenceDistanceKm: nearby.length ? Number(nearby[0].distanceKm.toFixed(6)) : null,
      strongestReferenceImportance: nearby.length ? Math.max(...nearby.map((item) => item.reference.importance)) : null,
      lockedReferenceCount: nearby.filter((item) => item.reference.locked).length,
      constraintReferenceCount: nearby.filter((item) => item.reference.pointType === "constraint").length,
    };
  });

  return Object.freeze({
    schemaVersion: 1,
    phase: "T3-D",
    authoritative: false,
    status: "candidate-association",
    radiusKm,
    source: {
      t3Phase: t3Result.phase,
      adjacencyVersion: adjacencyGraph.version,
    },
    pointAssociations,
    edgeAssociations,
    diagnostics: {
      referencePointCount: points.length,
      associatedPointCount: pointAssociations.filter((item) => item.withinAssociationRadius).length,
      edgeCount: edgeAssociations.length,
      edgesWithReferencePoints: edgeAssociations.filter((item) => item.referencePointCount > 0).length,
    },
  });
}
