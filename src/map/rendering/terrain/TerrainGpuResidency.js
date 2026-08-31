const STATES = Object.freeze(["requested", "loading", "resident", "evicting"]);
function assertId(id) { if (typeof id !== "string" || !id) throw new Error("Terrain residency requires a tile id."); }

export class TerrainGpuResidency {
  constructor({ maxBytes = 256 * 1024 * 1024, maxTiles = 256 } = {}) { if (!Number.isInteger(maxBytes) || maxBytes < 1) throw new Error("maxBytes must be positive."); if (!Number.isInteger(maxTiles) || maxTiles < 1) throw new Error("maxTiles must be positive."); this.maxBytes = maxBytes; this.maxTiles = maxTiles; this.usedBytes = 0; this.entries = new Map(); this.clock = 0; }
  request(tileId, bytes = 0, priority = 0) { assertId(tileId); if (!Number.isFinite(bytes) || bytes < 0) throw new Error("Terrain tile bytes must be non-negative."); if (!Number.isFinite(priority)) throw new Error("Terrain tile priority must be finite."); const existing = this.entries.get(tileId); if (existing) { existing.priority = priority; existing.lastUsed = ++this.clock; return Object.freeze({ ...existing }); } const entry = { tileId, bytes, priority, lastUsed: ++this.clock, state: "requested" }; this.entries.set(tileId, entry); return Object.freeze({ ...entry }); }
  beginLoad(tileId) { return this.#transition(tileId, "loading"); }
  markResident(tileId) { const entry = this.#transition(tileId, "resident"); this.usedBytes += entry.bytes; this.#enforceBudget(); return Object.freeze({ ...entry }); }
  touch(tileId) { const entry = this.entries.get(tileId); if (!entry || entry.state !== "resident") return false; entry.lastUsed = ++this.clock; return true; }
  beginEviction(tileId) { const entry = this.entries.get(tileId); if (!entry || entry.state !== "resident") return false; entry.state = "evicting"; return true; }
  finishEviction(tileId) { const entry = this.entries.get(tileId); if (!entry || entry.state !== "evicting") return false; this.usedBytes = Math.max(0, this.usedBytes - entry.bytes); this.entries.delete(tileId); return true; }
  get(tileId) { const entry = this.entries.get(tileId); return entry ? Object.freeze({ ...entry }) : null; }
  snapshot() { return Object.freeze({ usedBytes: this.usedBytes, maxBytes: this.maxBytes, residentTiles: [...this.entries.values()].filter((entry) => entry.state === "resident").length, entries: Object.freeze([...this.entries.values()].map((entry) => Object.freeze({ ...entry }))) }); }
  #transition(tileId, state) { assertId(tileId); const entry = this.entries.get(tileId); if (!entry) throw new Error(`Unknown terrain tile: ${tileId}.`); if (!STATES.includes(state)) throw new Error(`Unknown terrain residency state: ${state}.`); entry.state = state; entry.lastUsed = ++this.clock; return entry; }
  #enforceBudget() { while (this.usedBytes > this.maxBytes || [...this.entries.values()].filter((entry) => entry.state === "resident").length > this.maxTiles) { const candidates = [...this.entries.values()].filter((entry) => entry.state === "resident").sort((a,b) => a.priority - b.priority || a.lastUsed - b.lastUsed); if (!candidates.length) throw new Error("Terrain GPU budget cannot be satisfied without evicting non-resident resources."); candidates[0].state = "evicting"; break; } }
}

export { STATES };
