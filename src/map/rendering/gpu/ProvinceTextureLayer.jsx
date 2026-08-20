import { useEffect, useMemo, useRef } from "react";
import { WORLD_LAND_POLYGONS } from "../../physical/WorldPhysicalAtlas";
import {
  getProvincePresentation,
  getProvinceTextureProfile,
  shouldUseGpuProvinceFill,
} from "../CartographyModel";

const DEFAULT_WIDTH = 2048;
const DEFAULT_HEIGHT = 1024;
const SELECTED_COLOR = [214 / 255, 176 / 255, 77 / 255, 1];

const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aUv;

uniform vec2 uCameraCenter;
uniform vec2 uViewSize;
uniform vec2 uViewportScale;

out vec2 vUv;

void main() {
  vec2 normalized = (aPosition - uCameraCenter) / (uViewSize * 0.5);
  normalized *= uViewportScale;
  gl_Position = vec4(normalized, 0.0, 1.0);
  vUv = aUv;
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uProvinceIds;
uniform sampler2D uPalette;
uniform float uPaletteSize;
uniform float uSelectedId;
uniform vec4 uSelectedColor;
uniform float uFillOpacity;

in vec2 vUv;
out vec4 outColor;

float decodeProvinceId(vec4 encoded) {
  vec3 bytes = floor(encoded.rgb * 255.0 + 0.5);
  return bytes.r + bytes.g * 256.0 + bytes.b * 65536.0;
}

void main() {
  // The political raster is hard-clipped against the physical land mask
  // before upload. Alpha is therefore the authoritative coastline guard.
  vec4 encodedProvince = texture(uProvinceIds, vUv);
  if (encodedProvince.a < 0.5) discard;

  float provinceId = decodeProvinceId(encodedProvince);
  if (provinceId < 0.5) discard;

  float paletteIndex = provinceId - 1.0;
  vec2 paletteUv = vec2((paletteIndex + 0.5) / uPaletteSize, 0.5);
  vec4 color = texture(uPalette, paletteUv);

  if (uSelectedId > 0.5 && abs(provinceId - uSelectedId) < 0.5) {
    color = mix(color, uSelectedColor, 0.62);
  }

  color.a *= uFillOpacity;
  outColor = color;
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL shader creation failed.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL program creation failed.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown WebGL program error";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function createRasterCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function projectPoint(point, width, height) {
  const longitude = Number(point?.[0]);
  const latitude = Number(point?.[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return [
    ((longitude + 180) / 360) * width,
    ((90 - latitude) / 180) * height,
  ];
}

function drawPolygon(ctx, polygon, width, height) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let started = false;
  for (const point of polygon) {
    const projected = projectPoint(point, width, height);
    if (!projected) continue;
    if (!started) {
      ctx.moveTo(projected[0], projected[1]);
      started = true;
    } else {
      ctx.lineTo(projected[0], projected[1]);
    }
  }
  if (!started) return false;
  ctx.closePath();
  return true;
}

function drawPolygons(ctx, polygons, width, height) {
  ctx.beginPath();
  let count = 0;
  for (const polygon of polygons ?? []) {
    if (drawPolygon(ctx, polygon, width, height)) count += 1;
  }
  if (count) ctx.fill();
}

function applyLandMask(ctx, landCanvas) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(landCanvas, 0, 0);
  ctx.restore();
}

function encodeId(id) {
  return [id & 255, (id >> 8) & 255, (id >> 16) & 255];
}

function parseHexColor(value, fallback = [111, 118, 95]) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return fallback;
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function buildRasterData(provinces, mapStyle, profile = {}) {
  const width = Number(profile.width) || DEFAULT_WIDTH;
  const height = Number(profile.height) || DEFAULT_HEIGHT;
  const provinceCanvas = createRasterCanvas(width, height);
  const landCanvas = createRasterCanvas(width, height);
  if (!provinceCanvas || !landCanvas) return null;

  const provinceContext = provinceCanvas.getContext("2d", { alpha: true });
  const landContext = landCanvas.getContext("2d", { alpha: true });
  if (!provinceContext || !landContext) return null;

  provinceContext.clearRect(0, 0, width, height);
  landContext.clearRect(0, 0, width, height);
  landContext.fillStyle = "white";
  drawPolygons(landContext, WORLD_LAND_POLYGONS, width, height);

  // Keep the GPU set exactly identical to ProvinceLayer. Curated country
  // overlays are research metadata and must never become a second political
  // geometry source at world/regional LOD.
  const runtimeProvinces = provinces.filter((entry) => (
    entry?.province?.historical?.classification !== "curated-regional-gameplay-overlay"
    && entry?.province?.id
    && Array.isArray(entry?.geometry?.polygons)
    && entry.geometry.polygons.length > 0
  ));
  const provinceIds = [null];
  const palette = new Uint8Array((runtimeProvinces.length + 1) * 4);

  runtimeProvinces.forEach((entry, index) => {
    const rasterId = index + 1;
    const [r, g, b] = encodeId(rasterId);
    const color = mapStyle === "terrain"
      ? entry.country?.terrainColor ?? entry.country?.color
      : entry.country?.color;
    const [cr, cg, cb] = parseHexColor(color);

    provinceIds[rasterId] = entry.province.id;
    palette[rasterId * 4] = cr;
    palette[rasterId * 4 + 1] = cg;
    palette[rasterId * 4 + 2] = cb;
    palette[rasterId * 4 + 3] = 255;
    provinceContext.fillStyle = `rgb(${r} ${g} ${b})`;
    drawPolygons(provinceContext, entry.geometry.polygons, width, height);
  });

  // Hard-clip the political raster itself. The GPU now needs only one
  // province texture; land-mask alpha is already encoded in its pixels.
  applyLandMask(provinceContext, landCanvas);

  return {
    width,
    height,
    provinceCanvas,
    provinceIds,
    palette,
  };
}

function createTexture(gl, source, linear = false) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("WebGL texture creation failed.");
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
  if (!texture) throw new Error("WebGL palette texture creation failed.");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, palette.length / 4, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, palette);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

function createQuad(gl) {
  const vertices = [
    [-180, -90, 0, 1], [180, -90, 1, 1], [180, 90, 1, 0],
    [-180, -90, 0, 1], [180, 90, 1, 0], [-180, 90, 0, 0],
  ];
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("WebGL vertex buffer creation failed.");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return { buffer, count: vertices.length };
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

function renderFrame(state, camera, width, height) {
  if (!state || !width || !height) return;
  const pixelSize = resizeCanvas(state.canvas, width, height);
  const gl = state.gl;
  gl.viewport(0, 0, pixelSize.width, pixelSize.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(state.program);

  const zoom = Math.max(1, Number(camera?.zoom ?? 1));
  const viewWidth = 360 / zoom;
  const viewHeight = 180 / zoom;
  const mapScale = Math.min(pixelSize.width / viewWidth, pixelSize.height / viewHeight);
  const viewportScale = [
    (viewWidth * mapScale) / pixelSize.width,
    (viewHeight * mapScale) / pixelSize.height,
  ];

  gl.uniform2f(state.uniforms.cameraCenter, Number(camera?.x ?? 0), Number(camera?.y ?? 0));
  gl.uniform2f(state.uniforms.viewSize, viewWidth, viewHeight);
  gl.uniform2f(state.uniforms.viewportScale, viewportScale[0], viewportScale[1]);
  gl.uniform1f(state.uniforms.selectedId, state.selectedRasterId);
  gl.uniform1f(state.uniforms.paletteSize, Math.max(1, state.paletteSize));
  gl.uniform1f(state.uniforms.fillOpacity, getProvincePresentation(zoom).fillOpacity);
  gl.uniform4f(state.uniforms.selectedColor, ...SELECTED_COLOR);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.provinceTexture);
  gl.uniform1i(state.uniforms.provinceIds, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, state.paletteTexture);
  gl.uniform1i(state.uniforms.palette, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, state.quad.buffer);
  gl.enableVertexAttribArray(state.attributes.position);
  gl.vertexAttribPointer(state.attributes.position, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(state.attributes.uv);
  gl.vertexAttribPointer(state.attributes.uv, 2, gl.FLOAT, false, 16, 8);
  gl.drawArrays(gl.TRIANGLES, 0, state.quad.count);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
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
  if (maxTextureSize < raster.width || maxTextureSize < raster.height) return null;

  const program = createProgram(gl);
  const state = {
    gl,
    canvas,
    program,
    uniforms: {
      cameraCenter: gl.getUniformLocation(program, "uCameraCenter"),
      viewSize: gl.getUniformLocation(program, "uViewSize"),
      viewportScale: gl.getUniformLocation(program, "uViewportScale"),
      provinceIds: gl.getUniformLocation(program, "uProvinceIds"),
      palette: gl.getUniformLocation(program, "uPalette"),
      paletteSize: gl.getUniformLocation(program, "uPaletteSize"),
      selectedId: gl.getUniformLocation(program, "uSelectedId"),
      selectedColor: gl.getUniformLocation(program, "uSelectedColor"),
      fillOpacity: gl.getUniformLocation(program, "uFillOpacity"),
    },
    attributes: {
      position: gl.getAttribLocation(program, "aPosition"),
      uv: gl.getAttribLocation(program, "aUv"),
    },
    provinceTexture: createTexture(gl, raster.provinceCanvas, false),
    paletteTexture: createPaletteTexture(gl, raster.palette),
    paletteSize: raster.palette.length / 4,
    selectedRasterId: 0,
    provinceIds: raster.provinceIds,
    quad: createQuad(gl),
  };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  return state;
}

function destroyState(state) {
  if (!state) return;
  const { gl } = state;
  gl.deleteTexture(state.provinceTexture);
  gl.deleteTexture(state.paletteTexture);
  gl.deleteBuffer(state.quad.buffer);
  gl.deleteProgram(state.program);
}

function getSelectedRasterId(state, selectedProvinceId) {
  if (!selectedProvinceId || !state?.provinceIds) return 0;
  const index = state.provinceIds.indexOf(selectedProvinceId);
  return index > 0 ? index : 0;
}

function ProvinceTextureLayer({
  provinces = [],
  camera = { x: 0, y: 0, zoom: 1 },
  selectedProvinceId = null,
  mapStyle = "detailed",
  onReady,
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const cameraRef = useRef(camera);
  const gpuEnabled = shouldUseGpuProvinceFill(camera.zoom);
  const { width: textureWidth, height: textureHeight } = getProvinceTextureProfile(camera.zoom);
  const raster = useMemo(
    () => (
      gpuEnabled
        ? buildRasterData(provinces, mapStyle, { width: textureWidth, height: textureHeight })
        : null
    ),
    [gpuEnabled, provinces, mapStyle, textureWidth, textureHeight],
  );
  const selectedProvinceRef = useRef(selectedProvinceId);

  useEffect(() => {
    cameraRef.current = camera;
    const state = stateRef.current;
    if (!state || !gpuEnabled) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) renderFrame(state, camera, rect.width, rect.height);
  }, [camera, gpuEnabled]);

  useEffect(() => {
    selectedProvinceRef.current = selectedProvinceId;
    const state = stateRef.current;
    if (!state || !gpuEnabled) return;
    state.selectedRasterId = getSelectedRasterId(state, selectedProvinceId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) renderFrame(state, cameraRef.current, rect.width, rect.height);
  }, [selectedProvinceId, gpuEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!gpuEnabled || !canvas || !raster) {
      onReady?.(false);
      return undefined;
    }

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

    state.selectedRasterId = getSelectedRasterId(state, selectedProvinceRef.current);
    stateRef.current = state;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      renderFrame(state, cameraRef.current, entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(canvas.parentElement ?? canvas);

    const initialRect = canvas.getBoundingClientRect();
    renderFrame(state, cameraRef.current, initialRect.width, initialRect.height);
    onReady?.(true);

    return () => {
      resizeObserver.disconnect();
      if (stateRef.current === state) stateRef.current = null;
      destroyState(state);
      onReady?.(false);
    };
  }, [gpuEnabled, onReady, raster]);

  if (!gpuEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="map-gpu-province-layer"
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

export default ProvinceTextureLayer;

export {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  encodeId,
  parseHexColor,
  applyLandMask,
};
