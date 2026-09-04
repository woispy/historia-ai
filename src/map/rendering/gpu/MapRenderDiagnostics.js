const DIAGNOSTIC_KEY = "__HISTORIA_MAP_RENDER_DIAGNOSTICS__";
const PASS_NAMES = Object.freeze([
  "renderPhysicalLand",
  "renderTerrain",
  "renderWaterAndCoast",
  "renderPoliticalProvinces",
]);
const DEFAULT_FLAGS = Object.freeze({
  renderPhysicalLand: true,
  renderTerrain: true,
  renderWaterAndCoast: true,
  renderPoliticalProvinces: true,
});

function isDev() {
  return Boolean(import.meta.env?.DEV);
}

function getState() {
  if (!isDev()) return null;
  const existing = globalThis[DIAGNOSTIC_KEY];
  if (existing && typeof existing === "object") return existing;
  const state = { ...DEFAULT_FLAGS };
  globalThis[DIAGNOSTIC_KEY] = state;
  return state;
}

function snapshot(state) {
  return Object.fromEntries(PASS_NAMES.map((passName) => [passName, state[passName] !== false]));
}

export function isMapRenderPassEnabled(passName) {
  if (!isDev()) return true;
  const state = getState();
  return state?.[passName] !== false;
}

export function getMapRenderDiagnostics() {
  if (!isDev()) return { ...DEFAULT_FLAGS };
  return snapshot(getState());
}

export function logMapRenderDiagnostics(label = "state") {
  if (!isDev()) return;
  const state = getState();
  console.info(`[MapRenderDiagnostics] ${label}`, snapshot(state));
}

export function installMapRenderDiagnostics() {
  if (!isDev()) return;
  const state = getState();
  if (state.__installed) return;
  Object.defineProperty(state, "__installed", { value: true, enumerable: false });

  state.setPassEnabled = (passName, enabled) => {
    if (!PASS_NAMES.includes(passName)) {
      throw new Error(`Unknown map render pass: ${passName}. Valid passes: ${PASS_NAMES.join(", ")}`);
    }
    state[passName] = Boolean(enabled);
    logMapRenderDiagnostics(`set ${passName}=${state[passName]}`);
  };

  state.setAll = (enabled) => {
    for (const passName of PASS_NAMES) state[passName] = Boolean(enabled);
    logMapRenderDiagnostics(`setAll=${Boolean(enabled)}`);
  };

  state.setOnly = (passName) => {
    if (!PASS_NAMES.includes(passName)) {
      throw new Error(`Unknown map render pass: ${passName}. Valid passes: ${PASS_NAMES.join(", ")}`);
    }
    for (const name of PASS_NAMES) state[name] = name === passName;
    logMapRenderDiagnostics(`setOnly=${passName}`);
  };

  state.reset = () => {
    Object.assign(state, DEFAULT_FLAGS);
    logMapRenderDiagnostics("reset");
  };

  state.help = () => {
    console.info("[MapRenderDiagnostics] commands", {
      state: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__",
      get: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.get()",
      reset: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.reset()",
      allOff: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setAll(false)",
      allOn: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setAll(true)",
      terrainOnly: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setOnly('renderTerrain')",
      physicalOnly: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setOnly('renderPhysicalLand')",
      waterOnly: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setOnly('renderWaterAndCoast')",
      politicalOnly: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setOnly('renderPoliticalProvinces')",
    });
  };

  state.get = () => getMapRenderDiagnostics();
  logMapRenderDiagnostics("installed");
}
