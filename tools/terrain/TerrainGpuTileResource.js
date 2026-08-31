const RESOURCE_STATES = Object.freeze({ CREATED: "created", UPLOADING: "uploading", RESIDENT: "resident", DESTROYED: "destroyed" });

function assertBytes(value) { if (!Number.isSafeInteger(value) || value < 1) throw new Error("GPU resource bytes must be a positive safe integer."); }
function assertId(id) { if (typeof id !== "string" || !id) throw new Error("GPU terrain tile ID is required."); }

export function createTerrainGpuTileResource({ tileId, vertexBytes, indexBytes, heightBytes, normalBytes = 0, splatBytes = 0 } = {}) {
  assertId(tileId); assertBytes(vertexBytes); assertBytes(indexBytes); assertBytes(heightBytes); if (!Number.isSafeInteger(normalBytes) || normalBytes < 0 || !Number.isSafeInteger(splatBytes) || splatBytes < 0) throw new Error("Optional terrain GPU resource sizes must be non-negative safe integers.");
  const resources = Object.freeze({ vertexBytes, indexBytes, heightBytes, normalBytes, splatBytes });
  const totalBytes = Object.values(resources).reduce((sum, value) => sum + value, 0);
  let state = RESOURCE_STATES.CREATED;
  let backendHandle = null;
  return Object.freeze({ tileId, resources, totalBytes, states: RESOURCE_STATES, get state() { return state; }, get backendHandle() { return backendHandle; }, beginUpload() { if (state !== RESOURCE_STATES.CREATED) throw new Error(`Invalid GPU terrain resource transition: ${state} -> uploading`); state = RESOURCE_STATES.UPLOADING; return this; }, markResident(handle) { if (state !== RESOURCE_STATES.UPLOADING || handle == null) throw new Error("GPU terrain resource requires an upload handle before becoming resident."); backendHandle = handle; state = RESOURCE_STATES.RESIDENT; return this; }, destroy() { if (state === RESOURCE_STATES.DESTROYED) throw new Error("GPU terrain resource is already destroyed."); backendHandle = null; state = RESOURCE_STATES.DESTROYED; return true; } });
}
