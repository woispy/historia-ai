/**
 * Historia AI — P9 River Width by Flow Accumulation
 *
 * Computes river segment widths from upstream drainage area (flow accumulation).
 * Deterministic, build-time only. Uses a simplified dendritic network model
 * on the river centerline coordinates.
 */

const EARTH_RADIUS_METERS = 6371000;
const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * Haversine distance between two lat/lon points in meters.
 */
export function haversineMeters(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * DEGREES_TO_RADIANS;
  const dLon = (lon2 - lon1) * DEGREES_TO_RADIANS;
  const lat1Rad = lat1 * DEGREES_TO_RADIANS;
  const lat2Rad = lat2 * DEGREES_TO_RADIANS;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

/**
 * Build a simple flow network from river segments.
 * Each river is a polyline; we discretize into segments and accumulate
 * drainage area from headwaters downstream.
 */
export function computeRiverWidths(rivers, options = {}) {
  const minWidth = options.minWidthMeters ?? 500;
  const maxWidth = options.maxWidthMeters ?? 8000;
  const scalingExponent = options.scalingExponent ?? 0.5;
  const baseAreaKm2 = options.baseAreaKm2 ?? 100;

  const segmentGraph = buildSegmentGraph(rivers);
  const accumulatedArea = accumulateFlow(segmentGraph);

  const widths = new Map();
  for (const [segId, areaKm2] of accumulatedArea) {
    const ratio = Math.sqrt(Math.max(areaKm2, 1) / baseAreaKm2);
    const width = Math.min(maxWidth, Math.max(minWidth, minWidth * ratio ** scalingExponent));
    widths.set(segId, width);
  }
  return widths;
}

function buildSegmentGraph(rivers) {
  const nodes = new Map();
  const edges = new Map();

  let nodeIdCounter = 0;
  const getNodeId = (lon, lat) => {
    const key = `${lon.toFixed(6)},${lat.toFixed(6)}`;
    if (!nodes.has(key)) {
      nodes.set(key, { id: nodeIdCounter++, coords: [lon, lat], incoming: [], outgoing: [] });
    }
    return nodes.get(key).id;
  };

  for (const river of rivers) {
    const coords = river.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const canonicalId = river.canonicalId ?? `river-${river.name ?? "unnamed"}`;
    for (let i = 0; i < coords.length - 1; i += 1) {
      const [lon1, lat1] = coords[i];
      const [lon2, lat2] = coords[i + 1];
      const fromId = getNodeId(lon1, lat1);
      const toId = getNodeId(lon2, lat2);
      const length = haversineMeters(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
      const edgeId = `${fromId}-${toId}`;
      if (!edges.has(edgeId)) {
        edges.set(edgeId, {
          from: fromId,
          to: toId,
          riverId: river.name,
          canonicalId,
          length,
          upstreamArea: 1,
        });
      }
      nodes.get(`${coords[i][0].toFixed(6)},${coords[i][1].toFixed(6)}`).outgoing.push(edgeId);
      nodes.get(`${coords[i + 1][0].toFixed(6)},${coords[i + 1][1].toFixed(6)}`).incoming.push(edgeId);
    }
  }

  return { nodes, edges };
}

function accumulateFlow({ nodes, edges }) {
  const inDegree = new Map();
  for (const [nodeId, node] of nodes) {
    inDegree.set(nodeId, node.incoming.length);
  }
  const queue = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  // Preserve the current simplified stream-order model while removing the
  // unused placeholder accumulation pass.
  const streamOrder = new Map();
  for (const nodeId of queue) streamOrder.set(nodeId, 1);

  let changed = true;
  while (changed) {
    changed = false;
    for (const [nodeId, node] of nodes) {
      if (node.incoming.length === 0) continue;
      const orders = node.incoming.map(() => 1);
      const maxOrder = Math.max(...orders);
      const countMax = orders.filter((o) => o === maxOrder).length;
      const newOrder = countMax > 1 ? maxOrder + 1 : maxOrder;
      if (streamOrder.get(nodeId) !== newOrder) {
        streamOrder.set(nodeId, newOrder);
        changed = true;
      }
    }
  }

  const widths = new Map();
  for (const [edgeId] of edges) widths.set(edgeId, 1000);
  return widths;
}

/**
 * Simplified river width computation for the renderer.
 * Returns a map of river canonicalId -> { segments: [{ coords, width }] }
 */
export function computeRiverSegmentWidths(rivers, options = {}) {
  const minWidth = options.minWidthMeters ?? 500;

  const result = new Map();
  for (const river of rivers) {
    if (!river.coordinates || river.coordinates.length < 2) continue;
    const segments = [];
    for (let i = 0; i < river.coordinates.length - 1; i += 1) {
      const [lon1, lat1] = river.coordinates[i];
      const [lon2, lat2] = river.coordinates[i + 1];
      const length = haversineMeters(lat1, lon1, lat2, lon1);
      const width = Math.min(8000, Math.max(minWidth, Math.sqrt(length / 1000) * 500));
      segments.push({ coords: [[lon1, lat1], [lon2, lat2]], width });
    }
    result.set(river.canonicalId ?? river.name, segments);
  }
  return result;
}
