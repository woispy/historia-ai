/* ============================================================================
 * Rendering Model
 * ========================================================================== */

export {
  createRendering,
} from "./RenderingFactory";

/* ============================================================================
 * Rendering Repository
 * ========================================================================== */

export {
  createRenderingRepository,
  setRendering,
  resetRendering,
} from "./RenderingRepository";

/* ============================================================================
 * Rendering Queries
 * ========================================================================== */

export {
  getRendering,
  getRenderer,
  getRenderingLayers,
  isDebugRendering,
} from "./RenderingQueries";

/* ============================================================================
 * Rendering Actions
 * ========================================================================== */

export {
  initializeRendering,
  setRenderer,
  setRenderingLayers,
  setDebugRendering,
} from "./RenderingActions";

/* ============================================================================
 * Rendering Bootstrap
 * ========================================================================== */

export {
  bootstrapRendering,
} from "./RenderingBootstrap";

/* ============================================================================
 * Rendering Engine
 * ========================================================================== */

export {
  createRenderingEngine,
} from "./RenderingEngine";

/* ============================================================================
 * React Components
 * ========================================================================== */

export {
  default as SvgRenderer,
} from "./SvgRenderer";

export {
  default as RenderRoot,
} from "./RenderRoot";

export {
  default as RenderLayer,
} from "./RenderLayer";

/* ============================================================================
 * GPU Map Renderer
 * ========================================================================== */

export {
  ProvinceGpuRenderer,
  buildProvinceRasterData,
  DEFAULT_WIDTH as GPU_MAP_TEXTURE_WIDTH,
  DEFAULT_HEIGHT as GPU_MAP_TEXTURE_HEIGHT,
} from "./gpu";

/* ============================================================================
 * React Hooks
 * ========================================================================== */

export {
  useRendering,
} from "./hooks";

/* ============================================================================
 * Rendering Services
 * ========================================================================== */

export {
  orderRenderLayers,
  getVisibleLayers,
  createRenderQueue,
} from "./services";
