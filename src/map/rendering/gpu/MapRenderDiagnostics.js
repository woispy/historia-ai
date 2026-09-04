const DIAGNOSTIC_KEY = "__HISTORIA_MAP_RENDER_DIAGNOSTICS__";
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

export function isMapRenderPassEnabled(passName) {
  if (!isDev()) return true;
  const state = getState();
  return state?.[passName] !== false;
}

export function logMapRenderDiagnostics() {
  if (!isDev()) return;
  const state = getState();
  console.info("[MapRenderDiagnostics]", {
    renderPhysicalLand: state.renderPhysicalLand !== false,
    renderTerrain: state.renderTerrain !== false,
    renderWaterAndCoast: state.renderWaterAndCoast !== false,
    renderPoliticalProvinces: state.renderPoliticalProvinces !== false,
  });
}

export function installMapRenderDiagnostics() {
  if (!isDev()) return;
  const state = getState();
  if (state.__installed) return;
  Object.defineProperty(state, "__installed", { value: true, enumerable: false });
  state.setPassEnabled = (passName, enabled) => {
    if (!(passName in DEFAULT_FLAGS)) throw new Error(`Unknown map render pass: ${passName}`);
    state[passName] = Boolean(enabled);
    logMapRenderDiagnostics();
  };
  state.reset = () => {
    Object.assign(state, DEFAULT_FLAGS);
    logMapRenderDiagnostics();
  };
  logMapRenderDiagnostics();
}
