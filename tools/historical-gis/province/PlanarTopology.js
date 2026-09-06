/**
 * Historia AI — Authoritative Planar Topology
 *
 * Build-time topology primitives. A Face owns cyclic directed arc
 * references. An Arc is the canonical shared border geometry and carries
 * exactly two incident face sides (a real face or an explicit outside face).
 * Province polygons are derived views.
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

  const confidence = arc.confidence == null ? null : finite(arc.confidence, "arc.confidence");
  if (confidence != null && (confidence < 0 || confidence > 1)) throw new Error(`Arc ${id} confidence must be in [0, 1]`);

  return {
    id, kind, startNode, endNode, leftFace, rightFace,
    geometry: Array.isArray(arc.geometry)
      ? arc.geometry.map((point) => validatePosition(point, `arc ${id} geometry`))
      : [],
    confidence,
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

function ringEntries(face) {
  return [face.outerRing ?? [], ...(face.holes ?? [])];
}

function expectedFaceDirection(arc, faceId) {
  if (arc.leftFace === faceId) return true;
  if (arc.rightFace === faceId) return false;
  return null;
}

function addError(errors, message) {
  errors.push(message);
}

function graphComponents(nodes, arcs) {
  const adjacency = new Map(Object.keys(nodes).map((id) => [id, []]));
  for (const arc of Object.values(arcs)) {
    if (adjacency.has(arc.startNode) && adjacency.has(arc.endNode)) {
      adjacency.get(arc.startNode).push(arc.endNode);
      adjacency.get(arc.endNode).push(arc.startNode);
    }
  }
  const components = [];
  const visited = new Set();
  for (const start of Object.keys(nodes).sort()) {
    if (visited.has(start)) continue;
    const queue = [start];
    const component = new Set();
    visited.add(start);
    while (queue.length) {
      const node = queue.shift();
      component.add(node);
      for (const next of adjacency.get(node) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
    components.push(component);
  }
  return components;
}

export function validatePlanarTopology(topology) {
  const errors = [];
  const nodes = topology?.nodes ?? {};
  const arcs = topology?.arcs ?? {};
  const faces = topology?.faces ?? {};

  // 1. Referential integrity + manifold side ownership.
  for (const [id, arc] of Object.entries(arcs)) {
    if (!nodes[arc.startNode]) addError(errors, `Arc ${id} references missing start node ${arc.startNode}`);
    if (!nodes[arc.endNode]) addError(errors, `Arc ${id} references missing end node ${arc.endNode}`);
    if (!faces[arc.leftFace]) addError(errors, `Arc ${id} references missing left face ${arc.leftFace}`);
    if (!faces[arc.rightFace]) addError(errors, `Arc ${id} references missing right face ${arc.rightFace}`);
    if (arc.leftFace === arc.rightFace && arc.kind !== "world") addError(errors, `Arc ${id} has identical face sides`);
  }

  const actualNodeArcs = new Map(Object.keys(nodes).map((id) => [id, new Set()]));
  const actualNodeFaces = new Map(Object.keys(nodes).map((id) => [id, new Set()]));
  const actualFaceArcs = new Map(Object.keys(faces).map((id) => [id, []]));

  for (const [id, arc] of Object.entries(arcs)) {
    actualNodeArcs.get(arc.startNode)?.add(id);
    actualNodeArcs.get(arc.endNode)?.add(id);
    for (const faceId of [arc.leftFace, arc.rightFace]) {
      const face = faces[faceId];
      if (!face) continue;
      actualFaceArcs.get(faceId)?.push(id);
      if (nodes[arc.startNode]) actualNodeFaces.get(arc.startNode)?.add(faceId);
      if (nodes[arc.endNode]) actualNodeFaces.get(arc.endNode)?.add(faceId);
    }
  }

  for (const [id, node] of Object.entries(nodes)) {
    const expectedArcs = [...(actualNodeArcs.get(id) ?? [])].sort();
    const declaredArcs = [...new Set((node.incidentArcs ?? []).map(String))].sort();
    if (expectedArcs.join("|") !== declaredArcs.join("|")) addError(errors, `Node ${id} incidentArcs incidence mismatch`);
    for (const arcId of declaredArcs) if (!arcs[arcId]) addError(errors, `Node ${id} references missing arc ${arcId}`);

    const expectedFaces = [...(actualNodeFaces.get(id) ?? [])].sort();
    const declaredFaces = [...new Set((node.incidentFaces ?? []).map(String))].sort();
    if (expectedFaces.join("|") !== declaredFaces.join("|")) addError(errors, `Node ${id} incidentFaces incidence mismatch`);

    const boundaryNode = node.kind === "corner" || node.kind === "world-boundary";
    if (node.incidentArcs.length < 3 && !boundaryNode) addError(errors, `Interior node ${id} must have degree >= 3`);
  }

  // 2. Face rings: existence, side ownership, directed continuity and closure.
  for (const [id, face] of Object.entries(faces)) {
    if ((face.outerRing ?? []).length < 3) addError(errors, `Face ${id} has an invalid outer ring`);
    for (const ring of ringEntries(face)) {
      if (ring.length === 0) continue;
      for (let index = 0; index < ring.length; index += 1) {
        const current = ring[index];
        const next = ring[(index + 1) % ring.length];
        const currentArc = arcs[current.arcId];
        const nextArc = arcs[next.arcId];
        if (!currentArc) {
          addError(errors, `Face ${id} references missing arc ${current.arcId}`);
          continue;
        }
        if (!nextArc) continue;

        const expectedDirection = expectedFaceDirection(currentArc, id);
        if (expectedDirection === null) addError(errors, `Face ${id} is not incident to arc ${current.arcId}`);
        else if (current.forward !== expectedDirection) addError(errors, `Face ${id} uses arc ${current.arcId} with wrong direction`);

        const currentEnd = endpointsForReference(currentArc, current.forward).end;
        const nextStart = endpointsForReference(nextArc, next.forward).start;
        if (currentEnd !== nextStart) addError(errors, `Face ${id} ring is not continuous between ${current.arcId} and ${next.arcId}`);
      }
    }
  }

  // 3. Face-side incidence: each directed arc reference must agree with the arc.
  const faceSideUse = new Map(Object.keys(arcs).map((id) => [id, { left: 0, right: 0 }]));
  for (const [faceId, face] of Object.entries(faces)) {
    for (const ring of ringEntries(face)) {
      for (const entry of ring) {
        const arc = arcs[entry.arcId];
        if (!arc) continue;
        if (entry.forward && arc.leftFace === faceId) faceSideUse.get(arc.id).left += 1;
        else if (!entry.forward && arc.rightFace === faceId) faceSideUse.get(arc.id).right += 1;
        else addError(errors, `Face ${faceId} uses arc ${arc.id} on an inconsistent side`);
      }
    }
  }
  for (const [arcId, use] of faceSideUse) {
    if (use.left > 1) addError(errors, `Arc ${arcId} has multiple left-face ring uses`);
    if (use.right > 1) addError(errors, `Arc ${arcId} has multiple right-face ring uses`);
  }

  // 4. Orphan detection: every topology primitive must participate in the graph.
  for (const [id, node] of Object.entries(nodes)) {
    if ((actualNodeArcs.get(id)?.size ?? 0) === 0) addError(errors, `Orphan node ${id}`);
  }
  for (const [id, uses] of faceSideUse) {
    if (uses.left === 0 && uses.right === 0) addError(errors, `Orphan arc ${id}`);
  }
  for (const [id, face] of Object.entries(faces)) {
    if ((actualFaceArcs.get(id)?.length ?? 0) === 0) addError(errors, `Orphan face ${id}`);
  }

  // 5. Connectivity + Euler characteristic are diagnostics after structural checks.
  const components = graphComponents(nodes, arcs);
  for (const component of components) {
    const nodeIds = component;
    const arcIds = Object.entries(arcs)
      .filter(([, arc]) => nodeIds.has(arc.startNode) && nodeIds.has(arc.endNode))
      .map(([id]) => id);
    const faceIds = new Set();
    for (const arcId of arcIds) {
      const arc = arcs[arcId];
      faceIds.add(arc.leftFace);
      faceIds.add(arc.rightFace);
    }
    const chi = nodeIds.size - arcIds.length + faceIds.size;
    if (chi !== 2) addError(errors, `Connected component Euler characteristic is ${chi}, expected 2`);
  }

  return {
    valid: errors.length === 0,
    errors,
    componentCount: components.length,
    eulerCharacteristic: planarEulerCharacteristic(topology),
  };
}

/** Euler characteristic V - E + F for the supplied planar graph. */
export function planarEulerCharacteristic(topology) {
  return Object.keys(topology?.nodes ?? {}).length
    - Object.keys(topology?.arcs ?? {}).length
    + Object.keys(topology?.faces ?? {}).length;
}
