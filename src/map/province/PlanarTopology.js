export const TOPOLOGY_NODE_TYPES = Object.freeze([
  "corner",
  "triple-point",
  "coast-junction",
  "river-junction",
  "region-junction",
  "world-boundary",
]);

export const TOPOLOGY_ARC_KINDS = Object.freeze([
  "province",
  "region",
  "duchy",
  "coast",
  "river",
  "lake",
  "world",
]);

export function createTopologyNode({ id, lon, lat, type = "triple-point", incidentArcs = [], incidentFaces = [] }) {
  return {
    id: Number(id),
    position: { lon: Number(lon), lat: Number(lat) },
    type,
    incidentArcs: [...incidentArcs],
    incidentFaces: [...incidentFaces],
  };
}

export function createTopologyArc({ id, startNode, endNode, leftFace, rightFace, points = [], kind = "province", physicalFeature = null }) {
  return {
    id: Number(id),
    startNode: Number(startNode),
    endNode: Number(endNode),
    leftFace: Number(leftFace),
    rightFace: Number(rightFace),
    geometry: { points: points.map(([lon, lat]) => [Number(lon), Number(lat)]) },
    classification: { kind, physicalFeature },
  };
}

export function createTopologyFace({ id, seedId, outerArcIds = [], holeArcIds = [], parentId = null }) {
  return {
    id: Number(id),
    seedId: Number(seedId),
    outerRing: [...outerArcIds].map(Number),
    holes: holeArcIds.map((ring) => ring.map(Number)),
    hierarchy: { parentId: parentId == null ? null : Number(parentId) },
  };
}

function fail(errors, message) {
  errors.push(message);
}

export function validatePlanarTopology(graph, { expectedComponents = null } = {}) {
  const errors = [];
  const nodes = new Map((graph?.nodes ?? []).map((node) => [Number(node.id), node]));
  const arcs = new Map((graph?.arcs ?? []).map((arc) => [Number(arc.id), arc]));
  const faces = new Map((graph?.faces ?? []).map((face) => [Number(face.id), face]));

  if (nodes.size !== (graph?.nodes ?? []).length) fail(errors, "duplicate node id");
  if (arcs.size !== (graph?.arcs ?? []).length) fail(errors, "duplicate arc id");
  if (faces.size !== (graph?.faces ?? []).length) fail(errors, "duplicate face id");

  for (const node of nodes.values()) {
    if (!Number.isFinite(node.position?.lon) || !Number.isFinite(node.position?.lat)) fail(errors, `node ${node.id} has invalid position`);
    if (!TOPOLOGY_NODE_TYPES.includes(node.type)) fail(errors, `node ${node.id} has invalid type`);
    const degree = new Set(node.incidentArcs ?? []).size;
    if (node.type !== "world-boundary" && degree < 3) fail(errors, `node ${node.id} degree ${degree} < 3`);
  }

  for (const arc of arcs.values()) {
    if (!nodes.has(arc.startNode) || !nodes.has(arc.endNode)) fail(errors, `arc ${arc.id} references missing node`);
    if (!faces.has(arc.leftFace) || !faces.has(arc.rightFace)) fail(errors, `arc ${arc.id} references missing face`);
    if (arc.leftFace === arc.rightFace && arc.classification?.kind !== "world") fail(errors, `arc ${arc.id} has identical left/right faces`);
    if (!TOPOLOGY_ARC_KINDS.includes(arc.classification?.kind)) fail(errors, `arc ${arc.id} has invalid kind`);
    if (!Array.isArray(arc.geometry?.points) || arc.geometry.points.length < 2) fail(errors, `arc ${arc.id} has insufficient geometry`);
  }

  const arcUse = new Map();
  for (const face of faces.values()) {
    if (!face.outerRing?.length) fail(errors, `face ${face.id} has empty outer ring`);
    const rings = [face.outerRing, ...(face.holes ?? [])];
    for (const ring of rings) {
      for (const arcId of ring) {
        if (!arcs.has(arcId)) fail(errors, `face ${face.id} references missing arc ${arcId}`);
        arcUse.set(arcId, (arcUse.get(arcId) ?? 0) + 1);
      }
    }
  }
  for (const [arcId, uses] of arcUse) {
    if (uses !== 2) fail(errors, `arc ${arcId} is referenced by ${uses} faces; expected 2`);
  }

  for (const arc of arcs.values()) {
    const start = nodes.get(arc.startNode);
    const end = nodes.get(arc.endNode);
    if (start && !(start.incidentArcs ?? []).includes(arc.id)) fail(errors, `node ${start.id} misses incident arc ${arc.id}`);
    if (end && !(end.incidentArcs ?? []).includes(arc.id)) fail(errors, `node ${end.id} misses incident arc ${arc.id}`);
  }

  const V = nodes.size;
  const E = arcs.size;
  const F = faces.size;
  const C = Number(expectedComponents ?? 1);
  const eulerExpected = 1 + C;
  const eulerValue = V - E + F;
  const eulerPass = eulerValue === eulerExpected;
  if (!eulerPass) fail(errors, `Euler invariant failed: V-E+F=${eulerValue}, expected ${eulerExpected}`);

  return {
    valid: errors.length === 0,
    errors,
    metrics: { nodes: V, arcs: E, faces: F, components: C, eulerValue, eulerExpected },
  };
}

export function assertPlanarTopology(graph, options) {
  const result = validatePlanarTopology(graph, options);
  if (!result.valid) throw new TypeError(`Invalid planar topology: ${result.errors.join("; ")}`);
  return result;
}
