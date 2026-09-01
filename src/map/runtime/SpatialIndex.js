/**
 * Compact quadtree for static province bounds.
 *
 * The index is rebuilt only when geometry changes. Per-frame visibility queries
 * return a small candidate list instead of scanning every province.
 */

const MAX_ITEMS = 24;
const MAX_DEPTH = 9;

export class QuadtreeIndex {
  constructor(items = []) {
    this.items = items;
    this.root = buildNode(items, 0, MAX_DEPTH);
  }

  query(bounds, out = []) {
    out.length = 0;
    queryNode(this.root, bounds, out, this.items);
    return out;
  }
}

function buildNode(items, depth, remainingDepth) {
  const node = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    itemIndices: [],
    children: null,
  };

  for (const index of items) {
    node.minX = Math.min(node.minX, index.minX);
    node.minY = Math.min(node.minY, index.minY);
    node.maxX = Math.max(node.maxX, index.maxX);
    node.maxY = Math.max(node.maxY, index.maxY);
  }

  if (items.length <= MAX_ITEMS || remainingDepth <= 0) {
    node.itemIndices = items.map((entry) => entry.index);
    return node;
  }

  const midX = (node.minX + node.maxX) * 0.5;
  const midY = (node.minY + node.maxY) * 0.5;
  const buckets = [[], [], [], []];
  const spill = [];

  for (const entry of items) {
    const left = entry.maxX <= midX;
    const right = entry.minX >= midX;
    const top = entry.maxY <= midY;
    const bottom = entry.minY >= midY;
    const quadrant = left && top ? 0 : right && top ? 1 : left && bottom ? 2 : right && bottom ? 3 : -1;
    if (quadrant >= 0) buckets[quadrant].push(entry);
    else spill.push(entry.index);
  }

  node.itemIndices = spill;
  node.children = buckets.map((bucket) => (
    bucket.length ? buildNode(bucket, depth + 1, remainingDepth - 1) : null
  ));
  return node;
}

function overlaps(node, bounds) {
  return !(node.maxX < bounds.minX || node.minX > bounds.maxX || node.maxY < bounds.minY || node.minY > bounds.maxY);
}

function queryNode(node, bounds, out, items) {
  if (!node || !overlaps(node, bounds)) return;
  for (const index of node.itemIndices) {
    const item = items[index];
    if (item && !(item.maxX < bounds.minX || item.minX > bounds.maxX || item.maxY < bounds.minY || item.minY > bounds.maxY)) {
      out.push(index);
    }
  }
  for (const child of node.children ?? []) queryNode(child, bounds, out, items);
}

export function buildSpatialItems(soa) {
  return Array.from({ length: soa.count }, (_, index) => ({
    index,
    minX: soa.minX[index],
    minY: soa.minY[index],
    maxX: soa.maxX[index],
    maxY: soa.maxY[index],
  }));
}

export default QuadtreeIndex;
