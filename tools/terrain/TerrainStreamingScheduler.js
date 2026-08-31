function assertPositiveInt(value, name) { if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer.`); }

export const TERRAIN_STREAM_STATES = Object.freeze({ QUEUED: "queued", LOADING: "loading", RESIDENT: "resident", EVICTING: "evicting" });

export function createTerrainStreamingScheduler({ maxLoadsPerFrame = 2, maxUploadsPerFrame = 1 } = {}) {
  assertPositiveInt(maxLoadsPerFrame, "maxLoadsPerFrame");
  assertPositiveInt(maxUploadsPerFrame, "maxUploadsPerFrame");
  const queue = new Map();
  const resident = new Map();
  const loading = new Map();

  function enqueue(tile, { priority = 0, frame = 0 } = {}) {
    if (!tile || typeof tile.id !== "string" || !tile.id) throw new Error("Streaming tile ID is required.");
    if (!Number.isFinite(priority) || !Number.isInteger(frame) || frame < 0) throw new Error("Invalid streaming priority/frame.");
    if (resident.has(tile.id) || loading.has(tile.id)) return false;
    queue.set(tile.id, { tile, priority, requestedFrame: frame, state: TERRAIN_STREAM_STATES.QUEUED });
    return true;
  }

  function beginFrame(frame) {
    if (!Number.isInteger(frame) || frame < 0) throw new Error("Frame must be a non-negative integer.");
    const candidates = [...queue.values()].sort((a, b) => b.priority - a.priority || a.requestedFrame - b.requestedFrame);
    const selected = candidates.slice(0, maxLoadsPerFrame);
    for (const entry of selected) { queue.delete(entry.tile.id); entry.state = TERRAIN_STREAM_STATES.LOADING; loading.set(entry.tile.id, entry); }
    return Object.freeze(selected.map((entry) => entry.tile));
  }

  function markLoaded(tileId, payload) {
    const entry = loading.get(tileId);
    if (!entry) throw new Error("Terrain tile is not loading.");
    if (payload == null) throw new Error("Loaded terrain tile payload is required.");
    loading.delete(tileId);
    resident.set(tileId, { ...entry, payload, state: TERRAIN_STREAM_STATES.RESIDENT });
    return resident.get(tileId);
  }

  function consumeUploads() {
    return Object.freeze([...resident.values()].slice(0, maxUploadsPerFrame));
  }

  function evict(tileId) {
    if (!resident.has(tileId)) throw new Error("Terrain tile is not resident.");
    const entry = resident.get(tileId);
    entry.state = TERRAIN_STREAM_STATES.EVICTING;
    resident.delete(tileId);
    return entry;
  }

  return Object.freeze({ maxLoadsPerFrame, maxUploadsPerFrame, states: TERRAIN_STREAM_STATES, enqueue, beginFrame, markLoaded, consumeUploads, evict, snapshot: () => Object.freeze({ queued: queue.size, loading: loading.size, resident: resident.size }) });
}
