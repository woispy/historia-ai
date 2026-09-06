/**
 * Historia AI — Authoritative Planar Topology
 *
 * Build-time topology primitives. A Face owns a cyclic list of directed
 * half-edge references. An Arc is the canonical shared border geometry and
 * carries the two incident faces. Province polygons are derived views.
 */

export const ARC_KINDS = Object.freeze([
  "province", "duchy", "region", "coast", "river", "lake", "world",
]);

export const NODE_KINDS = Object.freeze([
  "corner", "triple-point", "coast-junction", "river-junction", "region-junction", "world-boundary",
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

function normalizeRingEntry(entry) {
  if (typeof entry === "string") return { arcId: entry, forward: true };
  return { arcId: assertId(entry?.arcId, "face ring arcId"), forward: entry?.forward !== false };
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
  const startNode = assertId(arc.startNode, "arc.startNode");
  const endNode = assertId(arc.endNode, "arc.endNode");
  if (startNode === endNode) throw new Error(`Arc ${id} cannot start and end at the same node`);
  const leftFace = assertId(arc.leftFace, "arc.leftFace");
  const rightFace = assertId(arc.rightFace, "arc.rightFace");
  if (leftFace === rightFace && kind !== "world") throw new Error(`Arc ${id} cannot have the same left/right face`);

  return {
    id, kind, startNode, endNode, leftFace, rightFace,
    geometry: Array.isArray(arc.geometry)
      ? arc.geometry.map((point) => validatePosition(point, `arc ${id} geometry`))
      : [],
    confidence: arc.confidence == null ? null : finite(arc.confidence, "arc.confidence"),
  };
}

export function createTopologyFace(face) {
  const id = assertId(face?.id, "face.id");
  const outerRing = (face?.outerRing ?? []).map(normalizeRingEntry);
  if (outerRing.length < 3) throw new Error(`Face ${id} needs at least 3 directed arcs`);
  return {
    id,
    seedId: face?.seedId == null ? null : String(face.seedId),
    parentFaceId: face?.parentFaceId == null ? null : String(face.parentFaceId),
    outerRing,
    holes: (face?.holes ?? []).map((ring) => ring.map(normalizeRingEntry)),
  };
}

function endpointsForReference(arc, forward) {
  return forward
    ? { start: arc.startNode, end: arc.endNode }
    : { start: arc.endNode, end: arc.startNode };
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
    const ring = face.outerRing ?? [];
    if (ring.length < 3) errors.push(`Face ${id} has an invalid outer ring`);
    for (let index = 0; index < ring.length; index += 1) {
      const current = ring[index];
      const next = ring[(index + 1) % ring.length];
      const currentArc = arcs[current.arcId];
      const nextArc = arcs[next.arcId];
      if (!currentArc) {
        errors.push(`Face ${id} references missing arc ${current.arcId}`);
        continue;
      }
      if (currentArc.leftFace !== id && currentArc.rightFace !== id) {
        errors.push(`Face ${id} is not incident to arc ${current.arcId}`);
      }
      if (!nextArc) continue;
      const currentEnd = endpointsForReference(currentArc, current.forward).end;
      const nextStart = endpointsForReference(nextArc, next.forward).start;
      if (currentEnd !== nextStart) {
        errors.push(`Face ${id} ring is not continuous between ${current.arcId} and ${next.arcId}`);
      }
    }
  }

  for (const [id, node] of Object.entries(nodes)) {
    const boundaryNode = node.kind === "corner" || node.kind === "world-boundary";
    if (node.incidentArcs.length < 3 && !boundaryNode) errors.push(`Interior node ${id} must have degree >= 3`);
    for (const arcId of node.incidentArcs) {
      if (!arcs[arcId]) errors.push(`Node ${id} references missing arc ${arcId}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Euler characteristic for a connected planar subdivision with no holes. */
export function planarEulerCharacteristic(topology) {
  return Object.keys(topology?.nodes ?? {}).length
    - Object.keys(topology?.arcs ?? {}).length
    + Object.keys(topology?.faces ?? {}).length;
}
