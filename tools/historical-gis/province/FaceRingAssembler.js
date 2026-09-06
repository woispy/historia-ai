/** Historia AI — P3.9.1 Directed Face Ring Assembly. */

function assertId(value, name) {
  if (value === null || value === undefined || value === "") throw new Error(`${name} is required`);
  return String(value);
}

function endpoints(arc, forward) {
  return forward ? { start: arc.startNode, end: arc.endNode } : { start: arc.endNode, end: arc.startNode };
}

function normalizeEntry(entry) {
  if (typeof entry === "string") return { arcId: entry, forward: true };
  return { arcId: assertId(entry?.arcId, "ring arcId"), forward: entry?.forward !== false };
}

export function assembleDirectedRing(arcs, entries, { requireClosed = true } = {}) {
  if (!arcs || typeof arcs !== "object") throw new Error("arcs must be an object or map-like object");
  if (!Array.isArray(entries) || entries.length < 3) throw new Error("A face ring needs at least 3 arcs");
  const get = (id) => (arcs instanceof Map ? arcs.get(id) : arcs[id]);
  const ring = entries.map(normalizeEntry);
  const seen = new Set();
  for (let i = 0; i < ring.length; i += 1) {
    const current = ring[i];
    const next = ring[(i + 1) % ring.length];
    const arc = get(current.arcId);
    const nextArc = get(next.arcId);
    if (!arc) throw new Error(`Ring references missing arc ${current.arcId}`);
    if (!nextArc) throw new Error(`Ring references missing arc ${next.arcId}`);
    const key = `${current.arcId}:${current.forward ? "f" : "r"}`;
    if (seen.has(key)) throw new Error(`Ring repeats directed arc reference ${key}`);
    seen.add(key);
    if (endpoints(arc, current.forward).end !== endpoints(nextArc, next.forward).start) {
      throw new Error(`Directed ring is discontinuous between ${current.arcId} and ${next.arcId}`);
    }
  }
  if (requireClosed && endpoints(get(ring.at(-1).arcId), ring.at(-1).forward).end !== endpoints(get(ring[0].arcId), ring[0].forward).start) {
    throw new Error("Directed ring is not closed");
  }
  return ring.map((entry) => ({ ...entry }));
}

export function assembleFaceRing(arcs, { id, seedId = null, parentFaceId = null, outerRing, holes = [] } = {}) {
  const faceId = assertId(id, "face.id");
  return {
    id: faceId,
    seedId: seedId == null ? null : String(seedId),
    parentFaceId: parentFaceId == null ? null : String(parentFaceId),
    outerRing: assembleDirectedRing(arcs, outerRing),
    holes: holes.map((ring) => assembleDirectedRing(arcs, ring)),
  };
}

export function registerFaceFromSolverPaths(registry, { id, seedId = null, parentFaceId = null, paths, rightFaceResolver, kind = "province", confidence = null } = {}) {
  const faceId = assertId(id, "face.id");
  if (!Array.isArray(paths) || paths.length < 3) throw new Error("paths must contain at least 3 boundary paths");
  if (typeof rightFaceResolver !== "function") throw new Error("rightFaceResolver is required");
  const references = [];
  for (let index = 0; index < paths.length; index += 1) {
    const pathSpec = paths[index];
    const result = pathSpec?.result ?? pathSpec;
    const registered = registry.register({
      path: result?.path?.map((node) => ({ lon: node.lon, lat: node.lat })),
      leftFace: faceId,
      rightFace: rightFaceResolver(pathSpec, index),
      kind,
      confidence,
    });
    references.push({ arcId: registered.arc.id, forward: registered.forward });
  }
  return assembleFaceRing(registry.toTopology().arcs, { id: faceId, seedId, parentFaceId, outerRing: references });
}

export function faceUsesUniqueDirectedArcs(face) {
  const seen = new Set();
  for (const ring of [face?.outerRing ?? [], ...(face?.holes ?? [])]) {
    for (const raw of ring) {
      const entry = normalizeEntry(raw);
      const key = `${entry.arcId}:${entry.forward ? "f" : "r"}`;
      if (seen.has(key)) return false;
      seen.add(key);
    }
  }
  return true;
}

export { endpoints as directedArcEndpoints };
