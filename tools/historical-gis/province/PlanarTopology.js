/**
 * Historia AI — Authoritative Planar Topology
 *
 * Build-time topology primitives. Faces reference directed arcs; arcs reference
 * nodes and their two incident faces. Province polygons are derived views, not
 * the source of truth.
 */

export const ARC_KINDS = Object.freeze([
  "province",
  "duchy",
  "region",
  "coast",
  "river",
  "lake",
  "world",
]);

export const NODE_KINDS = Object.freeze([
  "corner",
  "triple-point",
  "coast-junction",
  "river-junction",
  "region-junction",
  "world-boundary",
]);

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function assertId(value, name) {
  if (value === null || value === undefined || value === "") throw new Error(`${name} is required`);
  return String(value);
}

function validatePosition(position, name) {
  const lon = finite(position?.lon, `${name}.lon`);
  const lat = finite(position?.lat, `${name}.lat`);
  if (lat < -90 || lat > 90) throw new Error(`${name}.lat must be in [-90, 90]`);
  if (lon < -180 || lon >= 180) throw new Error(`${name}.lon must be in [-180, 180)`);
  return { lon, lat };
}

export function createTopologyNode(node) {
  const id = assertId(node?.id, "node.id");
  const kind = node?.kind ?? "corner";
  if (!NODE_KINDS.includes(kind)) throw new Error(`Unsupported node kind: ${kind}`);
  return {
    id,
    kind,
    position: validatePosition(node.position, "node.position"),
    incidentArcs: [...new Set((node.incidentArcs ?? []).map(String))].sort(),
    incidentFaces: [...new Set((node.incidentFaces ?? []).map(String))].sort(),
  };
}

export function createTopologyArc(arc) {
  const id = assertId(arc?.id, "arc.id");
  const kind = arc?.kind ?? "province";
  if (!ARC_KINDS.includes(kind)) throw new Error(`Unsupported arc kind: ${kind}`);
  if (assertId(arc.startNode, "arc.startNode") === assertId(arc.endNode, "arc.endNode")) {
    throw new Error(`Arc ${id} cannot start and end at the same node`);
  }
  const leftFace = assertId(arc.leftFace, "arc.leftFace");
  const rightFace = assertId(arc.rightFace, "arc.rightFace");
  if (leftFace === rightFace && kind !== "world") {
    throw new Error(`Arc ${id} cannot have the same left/right face`);
  }

  return {
    id,
    kind,
    startNode: assertId(arc.startNode, "arc.startNode"),
    endNode: assertId(arc.endNode, "arc.endNode"),
    leftFace,
    rightFace,
    geometry: Array.isArray(arc.geometry)
      ? arc.geometry.map((point) => validatePosition(point, `arc ${id} geometry`))
      : [],
    confidence: arc.confidence == null ? null : finite(arc.confidence, "arc.confidence"),
  };
}

export function createTopologyFace(face) {
  const id = assertId(face?.id, "face.id");
  const outerRing = (face?.outerRing ?? []).map(String);
  if (outerRing.length < 3) throw new Error(`Face ${id} needs at least 3 directed arcs`);
  return {
    id,
    seedId: face?.seedId == null ? null : String(face.seedId),
    parentFaceId: face?.parentFaceId == null ? null : String(face.parentFaceId),
    outerRing,
    holes: (face?.holes ?? []).map((ring) => ring.map(String)),
  };
}

export function validatePlanarTopology(topology) {
  const errors = [];
  const nodes = topology?.nodes ?? {};
  const arcs = topology?.arcs ?? {};
  const faces = topology?.faces ?? {};

  for (const [id, arc] of Object.entries(arcs)) {
    if (!nodes[arc.startNode]) errors.push(`Arc ${id} references missing start node ${arc.startNode}`);
    if (!nodes[arc.endNode]) errors.push(`Arc ${id} references missing end node ${arc.endNode}`);
    if (!faces[arc.leftFace]) errors.push(`Arc ${id} references missing left face ${arc.leftFace}`);
    if (!faces[arc.rightFace]) errors.push(`Arc ${id} references missing right face ${arc.rightFace}`);
  }

  for (const [id, face] of Object.entries(faces)) {
    if (face.outerRing.length < 3) errors.push(`Face ${id} has an invalid outer ring`);
    for (const arcId of face.outerRing) {
      if (!arcs[arcId]) {
        errors.push(`Face ${id} references missing arc ${arcId}`);
        continue;
      }
      if (arcs[arcId].leftFace !== id) errors.push(`Face ${id} outer ring arc ${arcId} must have face on left side`);
    }
  }

  for (const [id, node] of Object.entries(nodes)) {
    if (node.incidentArcs.length < 3 && node.kind !== "world-boundary") {
      errors.push(`Node ${id} must have degree >= 3`);
    }
    for (const arcId of node.incidentArcs) {
      if (!arcs[arcId]) errors.push(`Node ${id} references missing arc ${arcId}`);
    }
  }

  const undirectedEdges = new Set();
  for (const arc of Object.values(arcs)) {
    const key = [arc.startNode, arc.endNode].sort().join("|");
    if (undirectedEdges.has(key)) errors.push(`Duplicate planar edge between ${arc.startNode} and ${arc.endNode}`);
    undirectedEdges.add(key);
  }

  return { valid: errors.length === 0, errors };
}

/** Euler characteristic for a connected planar subdivision with no holes. */
export function planarEulerCharacteristic(topology) {
  const vertexCount = Object.keys(topology?.nodes ?? {}).length;
  const edgeCount = Object.keys(topology?.arcs ?? {}).length;
  const faceCount = Object.keys(topology?.faces ?? {}).length;
  return vertexCount - edgeCount + faceCount;
}
