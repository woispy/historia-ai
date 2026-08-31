const STATES = Object.freeze({ REQUESTED: "requested", LOADING: "loading", RESIDENT: "resident", EVICTING: "evicting", EVICTED: "evicted" });

function assertId(id) { if (typeof id !== "string" || id.length === 0) throw new Error("Terrain tile ID is required."); }
function assertBudget(value) { if (!Number.isInteger(value) || value < 1) throw new Error("GPU tile budget must be a positive integer."); }

export function createTerrainGpuResidency({ maxResidentTiles = 256 } = {}) {
  assertBudget(maxResidentTiles);
  const records = new Map();
  const touch = (id, frame) => { const record = records.get(id); if (record) record.lastUsedFrame = frame; };
  const request = (id, frame = 0) => { assertId(id); if (!Number.isInteger(frame) || frame < 0) throw new Error("Frame must be a non-negative integer."); const existing = records.get(id); if (existing) { touch(id, frame); return existing; } const record = { id, state: STATES.REQUESTED, lastUsedFrame: frame }; records.set(id, record); return record; };
  const beginLoading = (id) => transition(id, STATES.LOADING);
  const markResident = (id, frame = 0) => { transition(id, STATES.RESIDENT); touch(id, frame); evictIfNeeded(); return records.get(id); };
  const beginEviction = (id) => transition(id, STATES.EVICTING);
  const finishEviction = (id) => { assertId(id); const record = records.get(id); if (!record || record.state !== STATES.EVICTING) throw new Error("Terrain tile is not evicting."); record.state = STATES.EVICTED; records.delete(id); return true; };
  function transition(id, state) { assertId(id); const record = records.get(id); if (!record) throw new Error("Terrain tile is not requested."); const allowed = record.state === STATES.REQUESTED ? state === STATES.LOADING : record.state === STATES.LOADING ? state === STATES.RESIDENT : record.state === STATES.RESIDENT ? state === STATES.EVICTING : false; if (!allowed) throw new Error(`Invalid terrain GPU residency transition: ${record.state} -> ${state}`); record.state = state; return record; }
  function evictIfNeeded() { while ([...records.values()].filter((r) => r.state === STATES.RESIDENT).length > maxResidentTiles) { const victim = [...records.values()].filter((r) => r.state === STATES.RESIDENT).sort((a, b) => a.lastUsedFrame - b.lastUsedFrame)[0]; victim.state = STATES.EVICTING; } }
  return Object.freeze({ maxResidentTiles, states: STATES, request, beginLoading, markResident, beginEviction, finishEviction, touch, snapshot: () => Object.freeze([...records.values()].map((record) => Object.freeze({ ...record }))) });
}
