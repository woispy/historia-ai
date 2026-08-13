import { useCallback, useEffect, useMemo, useRef } from "react";
import { WORLD_LAND_POLYGONS } from "../../physical/WorldPhysicalAtlas";
import { getProvincePresentation } from "../CartographyModel";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  buildProvinceRasterData,
} from "./ProvinceTextureBuilder";
import {
  PROVINCE_FRAGMENT_SHADER,
  PROVINCE_VERTEX_SHADER,
} from "./ProvinceGpuShaders";

const WATER_COLOR = [16 / 255, 44 / 255, 53 / 255, 1];
const LAND_COLOR = [40 / 255, 50 / 255, 41 / 255, 1];
const SELECTED_COLOR = [214 / 255, 176 / 255, 77 / 255, 1];
const MAX_TEXTURE_SIZE = 8192;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL shader oluşturulamadı.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "Bilinmeyen shader hatası";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function createProgram(gl) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, PROVINCE_VERTEX_SHADER);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, PROVINCE_FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL program oluşturulamadı.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "Bilinmeyen program hatası";
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return program;
}

function createTexture(gl, source, { linear = false } = {}) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("WebGL texture oluşturulamadı.");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

function createPaletteTexture(gl, palette) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("WebGL palet texture oluşturulamadı.");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    palette.length / 4,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    palette,
  );
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

function createQuadBuffer(gl) {
  const vertices = [];
  const copies = [-360, 0, 360];
  for (const offset of copies) {
    const quad = [
      [-180 + offset, -90, 0, 1],
      [180 + offset, -90, 1, 1],
      [180 + offset, 90, 1, 0],
      [-180 + offset, -90, 0, 1],
      [180 + offset, 90, 1, 0],
      [-180 + offset, 90, 0, 0],
    ];
    vertices.push(...quad.flat());
  }

  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("WebGL vertex buffer oluşturulamadı.");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return { buffer, count: vertices.length / 4 };
}

function resizeCanvas(canvas, width, height) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  return { width: pixelWidth, height: pixelHeight };
}

function getMapRect(width, height, zoom) {
  const viewWidth = 360 / Math.max(0.001, zoom);
  const viewHeight = 180 / Math.max(0.001, zoom);
  const scale = Math.min(width / viewWidth, height / viewHeight);
  const mapWidth = viewWidth * scale;
  const mapHeight = viewHeight * scale;
  return {
    left: (width - mapWidth) / 2,
    top: (height - mapHeight) / 2,
    width: mapWidth,
    height: mapHeight,
  };
}

function pickProvinceFromRaster(event, canvas, camera, raster) {
  if (!raster?.supported || !canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const mapRect = getMapRect(rect.width, rect.height, camera.zoom);
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (
    x < mapRect.left ||
    y < mapRect.top ||
    x > mapRect.left + mapRect.width ||
    y > mapRect.top + mapRect.height
  ) return null;

  const lon = camera.x + ((x - mapRect.left) / mapRect.width - 0.5) * (360 / camera.zoom);
  const lat = camera.y + (0.5 - (y - mapRect.top) / mapRect.height) * (180 / camera.zoom);
  const wrappedLon = ((lon + 180) % 360 + 360) % 360 - 180;
  const px = Math.max(0, Math.min(raster.width - 1, Math.floor(((wrappedLon + 180) / 360) * raster.width)));
  const py = Math.max(0, Math.min(raster.height - 1, Math.floor(((90 - lat) / 180) * raster.height)));

  const context = raster.provinceCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  const pixel = context.getImageData(px, py, 1, 1).data;
  const rasterId = pixel[0] + pixel[1] * 256 + pixel[2] * 65536;
  return raster.provinceIds[rasterId] ?? null;
}

function renderFrame(gl, state, camera, width, height, selectedProvinceId, zoom) {
  if (!state?.program || !width || !height) return;

  const pixelSize = resizeCanvas(state.canvas, width, height);
  gl.viewport(0, 0, pixelSize.width, pixelSize.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(state.program);

  const viewWidth = 360 / Math.max(0.001, camera.zoom);
  const viewHeight = 180 / Math.max(0.001, camera.zoom);
  const mapScale = Math.min(pixelSize.width / viewWidth, pixelSize.height / viewHeight);
  const viewportScale = [
    (viewWidth * mapScale) / pixelSize.width,
    (viewHeight * mapScale) / pixelSize.height,
  ];

  gl.uniform2f(state.uniforms.cameraCenter, camera.x, camera.y);
  gl.uniform2f(state.uniforms.viewSize, viewWidth, viewHeight);
  gl.uniform2f(state.uniforms.viewportScale, viewportScale[0], viewportScale[1]);
  gl.uniform1f(state.uniforms.selectedId, state.selectedRasterId);
  gl.uniform1f(state.uniforms.paletteSize, Math.max(1, state.paletteSize));
  gl.uniform1f(state.uniforms.fillOpacity, getProvincePresentation(zoom).fillOpacity);
  gl.uniform4f(state.uniforms.selectedColor, ...SELECTED_COLOR);
  gl.uniform4f(state.uniforms.waterColor, ...WATER_COLOR);
  gl.uniform4f(state.uniforms.landColor, ...LAND_COLOR);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.provinceTexture);
  gl.uniform1i(state.uniforms.provinceIds, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, state.landTexture);
  gl.uniform1i(state.uniforms.landMask, 1);

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, state.paletteTexture);
  gl.uniform1i(state.uniforms.palette, 2);

  gl.bindBuffer(gl.ARRAY_BUFFER, state.quad.buffer);
  gl.enableVertexAttribArray(state.attributes.position);
  gl.vertexAttribPointer(state.attributes.position, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(state.attributes.uv);
  gl.vertexAttribPointer(state.attributes.uv, 2, gl.FLOAT, false, 16, 8);
  gl.drawArrays(gl.TRIANGLES, 0, state.quad.count);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function getUniforms(gl, program) {
  return {
    cameraCenter: gl.getUniformLocation(program, "uCameraCenter"),
    viewSize: gl.getUniformLocation(program, "uViewSize"),
    viewportScale: gl.getUniformLocation(program, "uViewportScale"),
    provinceIds: gl.getUniformLocation(program, "uProvinceIds"),
    landMask: gl.getUniformLocation(program, "uLandMask"),
    palette: gl.getUniformLocation(program, "uPalette"),
    paletteSize: gl.getUniformLocation(program, "uPaletteSize"),
    selectedId: gl.getUniformLocation(program, "uSelectedId"),
    selectedColor: gl.getUniformLocation(program, "uSelectedColor"),
    fillOpacity: gl.getUniformLocation(program, "uFillOpacity"),
    waterColor: gl.getUniformLocation(program, "uWaterColor"),
    landColor: gl.getUniformLocation(program, "uLandColor"),
  };
}

function getAttributes(gl, program) {
  return {
    position: gl.getAttribLocation(program, "aPosition"),
    uv: gl.getAttribLocation(program, "aUv"),
  };
}

function destroyState(gl, state) {
  if (!state) return;
  gl.deleteTexture(state.provinceTexture);
  gl.deleteTexture(state.landTexture);
  gl.deleteTexture(state.paletteTexture);
  gl.deleteBuffer(state.quad.buffer);
  gl.deleteProgram(state.program);
}

function buildState(canvas, raster) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  if (maxTextureSize < Math.min(DEFAULT_WIDTH, DEFAULT_HEIGHT)) return null;

  const program = createProgram(gl);
  const state = {
    gl,
    canvas,
    program,
    uniforms: getUniforms(gl, program),
    attributes: getAttributes(gl, program),
    provinceTexture: createTexture(gl, raster.provinceCanvas),
    landTexture: createTexture(gl, raster.landCanvas, { linear: true }),
    paletteTexture: createPaletteTexture(gl, raster.palette),
    paletteSize: raster.palette.length / 4,
    selectedRasterId: 0,
    quad: createQuadBuffer(gl),
  };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  return state;
}

function getSelectedRasterId(raster, selectedProvinceId) {
  if (!selectedProvinceId || !raster?.provinceIds) return 0;
  const index = raster.provinceIds.indexOf(selectedProvinceId);
  return index > 0 ? index : 0;
}

function GpuCanvas({ canvasRef }) {
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}

function ProvinceGpuRenderer({
  provinces = [],
  camera = { x: 0, y: 0, zoom: 1 },
  selectedProvinceId = null,
  onProvinceClick,
  enabled = true,
  onReady,
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rasterRef = useRef(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  const raster = useMemo(() => {
    if (!enabled) return null;
    return buildProvinceRasterData({
      provinces,
      landPolygons: WORLD_LAND_POLYGONS,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
    });
  }, [enabled, provinces]);

  useEffect(() => {
    rasterRef.current = raster;
  }, [raster]);

  useEffect(() => {
    if (!enabled || !raster?.supported || !canvasRef.current) return undefined;

    const canvas = canvasRef.current;
    let state = null;
    try {
      state = buildState(canvas, raster);
    } catch (error) {
      console.error("Historia AI GPU map renderer initialization failed", error);
    }

    if (!state) {
      onReady?.(false);
      return undefined;
    }

    stateRef.current = state;
    onReady?.(true);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      sizeRef.current = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };
    });
    resizeObserver.observe(canvas.parentElement ?? canvas);

    return () => {
      resizeObserver.disconnect();
      destroyState(state.gl, state);
      if (stateRef.current === state) stateRef.current = null;
    };
  }, [enabled, onReady, raster]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    state.selectedRasterId = getSelectedRasterId(rasterRef.current, selectedProvinceId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) sizeRef.current = { width: rect.width, height: rect.height };
    renderFrame(
      state.gl,
      state,
      camera,
      sizeRef.current.width,
      sizeRef.current.height,
      selectedProvinceId,
      camera.zoom,
    );
  }, [camera, selectedProvinceId]);

  const handleClick = useCallback((event) => {
    const provinceId = pickProvinceFromRaster(
      event,
      canvasRef.current,
      camera,
      rasterRef.current,
    );
    if (provinceId) onProvinceClick?.(provinceId);
  }, [camera, onProvinceClick]);

  useEffect(() => {
    const parent = canvasRef.current?.parentElement;
    if (!parent) return undefined;
    parent.addEventListener("click", handleClick);
    return () => parent.removeEventListener("click", handleClick);
  }, [handleClick]);

  if (!enabled) return null;
  return <GpuCanvas canvasRef={canvasRef} />;
}

export default ProvinceGpuRenderer;
