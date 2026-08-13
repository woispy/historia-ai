/**
 * Historia AI — Province Topology Engine
 *
 * Converts imported polygon geometry into a deterministic adjacency graph.
 * The graph is deliberately independent from political ownership so the same
 * province topology can survive a change of country/controller.
 */

const EDGE_PRECISION = 5;
const GAP_TOLERANCE = 0.02;

function round(value) {
  return Math.round(Number(value) * 10 ** EDGE_PRECISION) / 10 ** EDGE_PRECISION;
}

function pointKey([x, y]) {
  return `${round(x)},${round(y)}`;
}

function edgeKey(a, b) {
  const left = pointKey(a);
  const right = pointKey(b);
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

function provincePairKey(leftProvinceId, rightProvinceId) {
  return leftProvinceId < rightProvinceId
    ? `${leftProvinceId}|${rightProvinceId}`
    : `${rightProvinceId}|${leftProvinceId}`;
}

function borderKey(leftProvinceId, rightProvinceId, edge) {
  return `${provincePairKey(leftProvinceId, rightProvinceId)}:${edgeKey(edge.start, edge.end)}`;
}

function polygonBounds(polygon) {
  const points = polygon.filter((point) => Array.isArray(point) && point.length >= 2);
  if (!points.length) return null;

  const xs = points.map(([x]) => Number(x));
  const ys = points.map(([, y]) => Number(y));
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function boundsCouldShareBorder(a, b, gapTolerance = GAP_TOLERANCE) {
  if (!a || !b) return false;

  const xOverlap = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const yOverlap = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
  const xGap = Math.max(a.minX - b.maxX, b.minX - a.maxX, 0);
  const yGap = Math.max(a.minY - b.maxY, b.minY - a.maxY, 0);

  const horizontalBoundary = xGap <= gapTolerance && yOverlap > gapTolerance;
  const verticalBoundary = yGap <= gapTolerance && xOverlap > gapTolerance;
  const overlappingBounds = xOverlap > gapTolerance && yOverlap > gapTolerance;

  return horizontalBoundary || verticalBoundary || overlappingBounds;
}

function getPolygonEdges(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return [];
  const edges = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    if (!Array.isArray(current) || !Array.isArray(next)) continue;
    edges.push({ key: edgeKey(current, next), start: current, end: next });
  }
  return edges;
}

export function getGeometryBounds(geometry) {
  const polygons = geometry?.polygons ?? [];
  const bounds = polygons.map(polygonBounds).filter(Boolean);
  if (!bounds.length) return null;
  return {
    minX: Math.min(...bounds.map((item) => item.minX)),
    minY: Math.min(...bounds.map((item) => item.minY)),
    maxX: Math.max(...bounds.map((item) => item.maxX)),
    maxY: Math.max(...bounds.map((item) => item.maxY)),
  };
}

export function buildProvinceTopology(provinces = []) {
  const nodes = new Map();
  const edgeIndex = new Map();

  for (const item of provinces) {
    const id = item?.province?.id;
    if (!id) continue;

    const geometry = item.geometry;
    const polygons = geometry?.polygons ?? [];
    const bounds = getGeometryBounds(geometry);
    nodes.set(id, {
      id,
      ownerId: item.province.owner ?? null,
      bounds,
      neighbors: new Set(),
    });

    for (const polygon of polygons) {
      for (const edge of getPolygonEdges(polygon)) {
        const owners = edgeIndex.get(edge.key) ?? [];
        owners.push({ provinceId: id, edge });
        edgeIndex.set(edge.key, owners);
      }
    }
  }

  const borderSegments = [];
  const borderKeys = new Set();

  for (const entries of edgeIndex.values()) {
    if (entries.length < 2) continue;

    for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
        const left = entries[leftIndex];
        const right = entries[rightIndex];
        if (left.provinceId === right.provinceId) continue;

        const leftNode = nodes.get(left.provinceId);
        const rightNode = nodes.get(right.provinceId);
        if (!leftNode || !rightNode) continue;

        leftNode.neighbors.add(right.provinceId);
        rightNode.neighbors.add(left.provinceId);

        const kind = leftNode.ownerId && rightNode.ownerId && leftNode.ownerId !== rightNode.ownerId
          ? "country"
          : "province";
        const key = borderKey(left.provinceId, right.provinceId, left.edge);

        if (borderKeys.has(key)) continue;
        borderKeys.add(key);

        borderSegments.push({
          key,
          leftProvinceId: left.provinceId,
          rightProvinceId: right.provinceId,
          kind,
          start: left.edge.start,
          end: left.edge.end,
        });
      }
    }
  }

  borderSegments.sort((left, right) => left.key.localeCompare(right.key));

  const nodeList = [...nodes.values()];
  for (let leftIndex = 0; leftIndex < nodeList.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodeList.length; rightIndex += 1) {
      const left = nodeList[leftIndex];
      const right = nodeList[rightIndex];
      if (!left.bounds || !right.bounds || left.neighbors.has(right.id)) continue;
      if (!boundsCouldShareBorder(left.bounds, right.bounds)) continue;

      left.neighbors.add(right.id);
      right.neighbors.add(left.id);
    }
  }

  return {
    nodes: Object.fromEntries(
      nodeList.map((node) => [
        node.id,
        {
          id: node.id,
          ownerId: node.ownerId,
          bounds: node.bounds,
          neighbors: [...node.neighbors].sort(),
        },
      ]),
    ),
    borderSegments,
  };
}

export function validateProvinceTopology(topology) {
  const errors = [];
  const nodes = topology?.nodes ?? {};
  const borderKeys = new Set();

  for (const [id, node] of Object.entries(nodes)) {
    if (node.neighbors.includes(id)) {
      errors.push(`${id} cannot be its own neighbor`);
    }

    for (const neighborId of node.neighbors) {
      if (!nodes[neighborId]) {
        errors.push(`${id} references missing neighbor ${neighborId}`);
        continue;
      }
      if (!nodes[neighborId].neighbors.includes(id)) {
        errors.push(`Adjacency must be symmetric: ${id} ↔ ${neighborId}`);
      }
    }
  }

  for (const border of topology?.borderSegments ?? []) {
    if (borderKeys.has(border.key)) {
      errors.push(`Duplicate border segment key: ${border.key}`);
    }
    borderKeys.add(border.key);

    if (border.leftProvinceId === border.rightProvinceId) {
      errors.push(`Border ${border.key} references the same province twice`);
    }
    if (!Array.isArray(border.start) || !Array.isArray(border.end)) {
      errors.push(`Border ${border.key} has invalid coordinates`);
    }
    if (!new Set(["province", "country"]).has(border.kind)) {
      errors.push(`Border ${border.key} has invalid kind`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export { borderKey, edgeKey, getPolygonEdges, polygonBounds, boundsCouldShareBorder };
