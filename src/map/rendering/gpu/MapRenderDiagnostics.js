const DIAGNOSTIC_KEY = "__HISTORIA_MAP_RENDER_DIAGNOSTICS__";
const DEBUG_MAP_KEY = "debugMap";
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
const PASS_ALIASES = Object.freeze({
  physical: "renderPhysicalLand",
  terrain: "renderTerrain",
  water: "renderWaterAndCoast",
  political: "renderPoliticalProvinces",
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

function resolvePassName(passName) {
  const resolved = PASS_ALIASES[passName] ?? passName;
  if (!PASS_NAMES.includes(resolved)) {
    throw new Error(`Unknown map render pass: ${passName}. Valid aliases: ${Object.keys(PASS_ALIASES).join(", ")}`);
  }
  return resolved;
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
    const resolved = resolvePassName(passName);
    state[resolved] = Boolean(enabled);
    logMapRenderDiagnostics(`set ${resolved}=${state[resolved]}`);
  };

  state.setAll = (enabled) => {
    for (const passName of PASS_NAMES) state[passName] = Boolean(enabled);
    logMapRenderDiagnostics(`setAll=${Boolean(enabled)}`);
  };

  state.setOnly = (passName) => {
    const resolved = resolvePassName(passName);
    for (const name of PASS_NAMES) state[name] = name === resolved;
    logMapRenderDiagnostics(`setOnly=${resolved}`);
  };

  state.togglePass = (passName) => {
    const resolved = resolvePassName(passName);
    state[resolved] = !state[resolved];
    logMapRenderDiagnostics(`toggle ${resolved}=${state[resolved]}`);
    return state[resolved];
  };

  state.reset = () => {
    Object.assign(state, DEFAULT_FLAGS);
    logMapRenderDiagnostics("reset");
  };

  state.help = () => {
    console.info("[MapRenderDiagnostics] commands", {
      state: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__",
      debugMap: "debugMap",
      get: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.get()",
      reset: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.reset()",
      allOff: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setAll(false)",
      allOn: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setAll(true)",
      terrainOnly: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setOnly('renderTerrain')",
      physicalOnly: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setOnly('renderPhysicalLand')",
      waterOnly: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setOnly('renderWaterAndCoast')",
      politicalOnly: "__HISTORIA_MAP_RENDER_DIAGNOSTICS__.setOnly('renderPoliticalProvinces')",
      toggleTerrain: "debugMap.togglePass('terrain')",
      togglePhysical: "debugMap.togglePass('physical')",
      toggleWater: "debugMap.togglePass('water')",
      togglePolitical: "debugMap.togglePass('political')",
    });
  };

  state.get = () => getMapRenderDiagnostics();
  globalThis[DEBUG_MAP_KEY] = state;
  logMapRenderDiagnostics("installed");
}
