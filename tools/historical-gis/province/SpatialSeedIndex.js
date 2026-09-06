/**
 * Historia AI — Spatial Seed Index
 *
 * Candidate-discovery accelerator for province seeds. The index is never
 * authoritative for geography: canonical seed storage remains the source of
 * truth and query results are deterministically ordered.
 */

const WORLD_WIDTH = 360;
const WORLD_MIN_LON = -180;
const WORLD_MAX_LON = 180;
const EPSILON = 1e-12;

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function canonicalLongitude(lon) {
  const value = finite(lon, "longitude");
  const wrapped = ((value - WORLD_MIN_LON) % WORLD_WIDTH + WORLD_WIDTH) % WORLD_WIDTH + WORLD_MIN_LON;
  return wrapped === WORLD_MAX_LON ? WORLD_MIN_LON : wrapped;
}

function latitude(lat) {
  const value = finite(lat, "latitude");
  if (value < -90 || value > 90) throw new Error("latitude must be in [-90, 90]");
  return value;
}

function longitudeDelta(fromLon, toLon) {
  const delta = ((toLon - fromLon + 180) % WORLD_WIDTH + WORLD_WIDTH) % WORLD_WIDTH - 180;
  return Object.is(delta, -0) ? 0 : delta;
}

function seamAwareTieBreak(queryLon, seedLon) {
  const canonicalQuery = canonicalLongitude(queryLon);
  if (canonicalQuery === WORLD_MIN_LON) {
    // +180 and -180 are the same canonical point, but an explicit query-side
    // rule is required when two candidates are equidistant across the seam.
    // Positive raw representatives select the eastern hemisphere; negative
    // representatives select the western hemisphere. A seed exactly on the
    // canonical seam remains neutral and is ordered before either side.
    if (seedLon === WORLD_MIN_LON) return 0;
    const eastQuery = queryLon >= WORLD_MAX_LON;
    const preferredHemisphere = eastQuery ? seedLon > WORLD_MIN_LON : seedLon < WORLD_MAX_LON;
    return preferredHemisphere ? 0 : 1;
  }
  return longitudeDelta(canonicalQuery, seedLon);
}

function distanceSquared(aLon, aLat, bLon, bLat) {
  const dxRaw = Math.abs(aLon - bLon);
  const dx = Math.min(dxRaw, WORLD_WIDTH - dxRaw);
  const dy = aLat - bLat;
  return dx * dx + dy * dy;
}

function compareDistance(a, b) {
  const delta = a - b;
  return Math.abs(delta) <= EPSILON ? 0 : delta;
}

function cellKey(x, y) {
  return `${x}:${y}`;
}

function normalizeBounds(bounds) {
  const minLat = Math.min(latitude(bounds.minLat), latitude(bounds.maxLat));
  const maxLat = Math.max(latitude(bounds.minLat), latitude(bounds.maxLat));
  return { minLon: canonicalLongitude(bounds.minLon), maxLon: canonicalLongitude(bounds.maxLon), minLat, maxLat };
}

/**
 * Uniform longitude/latitude spatial hash. It is deliberately a small,
 * dependency-free implementation so P3 can swap the accelerator without
 * changing tessellation contracts.
 */
export class SpatialHashSeedIndex {
  constructor({ cellSize = 5 } = {}) {
    this.cellSize = finite(cellSize, "cellSize");
    if (this.cellSize <= 0 || this.cellSize > WORLD_WIDTH) throw new Error("cellSize must be in (0, 360]");
    this.columns = Math.max(1, Math.ceil(WORLD_WIDTH / this.cellSize));
    this.rows = Math.max(1, Math.ceil(180 / this.cellSize));
    this.cells = new Map();
    this.seeds = new Map();
  }

  _cell(lon, lat) {
    const canonicalLon = canonicalLongitude(lon);
    const x = Math.min(this.columns - 1, Math.floor((canonicalLon - WORLD_MIN_LON) / this.cellSize));
    const y = Math.min(this.rows - 1, Math.floor((latitude(lat) + 90) / this.cellSize));
    return { x, y };
  }

  _insertCell(seedId, x, y) {
    const key = cellKey(x, y);
    const bucket = this.cells.get(key) ?? new Set();
    bucket.add(seedId);
    this.cells.set(key, bucket);
  }

  _removeCell(seedId, x, y) {
    const key = cellKey(x, y);
    const bucket = this.cells.get(key);
    if (!bucket) return;
    bucket.delete(seedId);
    if (bucket.size === 0) this.cells.delete(key);
  }

  insert(seed) {
    const id = String(seed?.id ?? "");
    if (!id) throw new Error("seed.id is required");
    const lon = canonicalLongitude(seed?.position?.lon);
    const lat = latitude(seed?.position?.lat);
    if (this.seeds.has(id)) this.remove(id);
    const stored = { ...seed, id, position: { ...seed.position, lon, lat } };
    const cell = this._cell(lon, lat);
    this.seeds.set(id, { seed: stored, cell });
    this._insertCell(id, cell.x, cell.y);
    return stored;
  }

  remove(id) {
    const key = String(id);
    const entry = this.seeds.get(key);
    if (!entry) return false;
    this._removeCell(key, entry.cell.x, entry.cell.y);
    this.seeds.delete(key);
    return true;
  }

  clear() {
    this.cells.clear();
    this.seeds.clear();
  }

  get size() {
    return this.seeds.size;
  }

  get(id) {
    return this.seeds.get(String(id))?.seed ?? null;
  }

  _candidateCells(lon, lat, radius) {
    const center = this._cell(lon, lat);
    const span = Math.max(1, Math.ceil(radius / this.cellSize));
    const cells = [];
    const y0 = Math.max(0, center.y - span);
    const y1 = Math.min(this.rows - 1, center.y + span);
    for (let y = y0; y <= y1; y += 1) {
      for (let dx = -span; dx <= span; dx += 1) {
        const x = ((center.x + dx) % this.columns + this.columns) % this.columns;
        cells.push(cellKey(x, y));
      }
    }
    return cells;
  }

  queryRadius(lon, lat, radius) {
    const rawLon = finite(lon, "longitude");
    const qLon = canonicalLongitude(rawLon);
    const qLat = latitude(lat);
    const r = Math.max(0, finite(radius, "radius"));
    const ids = new Set();
    for (const key of this._candidateCells(qLon, qLat, r)) {
      for (const id of this.cells.get(key) ?? []) ids.add(id);
    }
    return [...ids]
      .map((id) => this.seeds.get(id)?.seed)
      .filter(Boolean)
      .map((seed) => ({
        seed,
        distanceSquared: distanceSquared(qLon, qLat, seed.position.lon, seed.position.lat),
        longitudeDelta: seamAwareTieBreak(rawLon, seed.position.lon),
      }))
      .filter((entry) => entry.distanceSquared <= r * r + EPSILON)
      .sort((a, b) => compareDistance(a.distanceSquared, b.distanceSquared) || a.longitudeDelta - b.longitudeDelta || a.seed.id.localeCompare(b.seed.id))
      .map((entry) => entry.seed);
  }

  queryBounds(bounds) {
    const normalized = normalizeBounds(bounds);
    const intervals = normalized.minLon <= normalized.maxLon
      ? [[normalized.minLon, normalized.maxLon]]
      : [[normalized.minLon, WORLD_MAX_LON], [WORLD_MIN_LON, normalized.maxLon]];
    const ids = new Set();
    const minX = Math.floor((normalized.minLon - WORLD_MIN_LON) / this.cellSize);
    const maxX = Math.floor((normalized.maxLon - WORLD_MIN_LON) / this.cellSize);
    const minY = Math.max(0, Math.floor((normalized.minLat + 90) / this.cellSize));
    const maxY = Math.min(this.rows - 1, Math.floor((normalized.maxLat + 90) / this.cellSize));
    const xRanges = normalized.minLon <= normalized.maxLon
      ? [[minX, maxX]]
      : [[minX, this.columns - 1], [0, maxX]];
    for (const [x0, x1] of xRanges) {
      for (let x = x0; x <= x1; x += 1) {
        for (let y = minY; y <= maxY; y += 1) {
          for (const id of this.cells.get(cellKey(x, y)) ?? []) ids.add(id);
        }
      }
    }
    return [...ids]
      .map((id) => this.seeds.get(id)?.seed)
      .filter(Boolean)
      .filter((seed) => {
        const seedLon = seed.position.lon;
        const inLon = intervals.some(([a, b]) => seedLon >= a - EPSILON && seedLon <= b + EPSILON);
        return inLon && seed.position.lat >= normalized.minLat - EPSILON && seed.position.lat <= normalized.maxLat + EPSILON;
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  nearest(lon, lat, { maxRadius = WORLD_WIDTH } = {}) {
    const rawLon = finite(lon, "longitude");
    const qLat = latitude(lat);
    const radius = Math.max(0, finite(maxRadius, "maxRadius"));
    const results = this.queryRadius(rawLon, qLat, radius);
    return results[0] ?? null;
  }
}

export const canonicalSeedLongitude = canonicalLongitude;
