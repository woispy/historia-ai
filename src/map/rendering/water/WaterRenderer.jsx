import { useEffect, useMemo, useRef } from "react";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../data/AnatoliaPhysicalAtlasRuntime.js";
import { buildRiverRibbonGeometry } from "./WaterGeometry.js";
import { buildPhysicalWaterMask } from "./WaterMask.js";
import {
  RIVER_FRAGMENT_SHADER,
  RIVER_VERTEX_SHADER,
  WATER_SURFACE_FRAGMENT_SHADER,
  WATER_VERTEX_SHADER,
} from "./WaterShaders.js";

const COASTLINE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uPhysicalMask;
uniform float uTime;

in vec2 vUv;
out vec4 outColor;

float waterAt(vec2 uv) {
  vec4 mask = texture(uPhysicalMask, clamp(uv, 0.001, 0.999));
  return max(1.0 - mask.r, max(mask.g, mask.b));
}

void main() {
  float centerWater = waterAt(vUv);
  vec2 texel = vec2(1.0 / 2048.0, 1.0 / 1024.0);
  float neighbours = 0.0;
  neighbours += waterAt(vUv + vec2(texel.x, 0.0));
  neighbours += waterAt(vUv - vec2(texel.x, 0.0));
  neighbours += waterAt(vUv + vec2(0.0, texel.y));
  neighbours += waterAt(vUv - vec2(0.0, texel.y));
  float gradient = abs(neighbours * 0.25 - centerWater);
  float edge = smoothstep(0.10, 0.42, gradient);
  float wave = 0.5 + 0.5 * sin(vUv.x * 96.0 + vUv.y * 71.0 + uTime * 0.42);
  edge *= 0.70 + wave * 0.30;
  if (edge < 0.12) discard;
  outColor = vec4(0.92, 0.98, 0.98, edge * 0.30);
}
`;

const SURFACE_COLORS = Object.freeze({
  ocean: [0.055, 0.19, 0.25],
  sea: [0.07, 0.28, 0.34],
  lake: [0.075, 0.32, 0.37],
  reflection: [0.33, 0.55, 0.58],
  river: [0.06, 0.31, 0.37],
  foam: [0.91, 0.97, 0.98],
});

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Water shader creation failed.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown water shader compilation error";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Water program creation failed.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown water program link error";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function createTexture(gl, source, linear = true) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Water texture creation failed.");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

function createNormalMap(gl, size = 64) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const nx = Math.sin(x * 0.37) * 0.28 + Math.cos(y * 0.21) * 0.16;
      const ny = Math.cos(y * 0.31) * 0.24 + Math.sin(x * 0.19) * 0.14;
      const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx - ny * ny));
      pixels[i] = Math.round((nx * 0.5 + 0.5) * 255);
      pixels[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      pixels[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      pixels[i + 3] = 255;
    }
  }
  const texture = gl.createTexture();
  if (!texture) throw new Error("Water normal-map texture creation failed.");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

function createQuad(gl) {
  const vertices = new Float32Array([
    -180, -90, 0, 1,
    180, -90, 1, 1,
    180, 90, 1, 0,
    -180, -90, 0, 1,
    180, 90, 1, 0,
    -180, 90, 0, 0,
  ]);
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("Water quad buffer creation failed.");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return { buffer, count: 6 };
}

function createRiverBuffers(gl, geometry) {
  if (!geometry?.indices?.length) return null;
  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  if (!vertexBuffer || !indexBuffer) throw new Error("River GPU buffer creation failed.");
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  return { vertexBuffer, indexBuffer, indexCount: geometry.indices.length };
}

function getUniforms(gl, program, names) {
  return Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));
}

function setupContext(canvas, maskCanvas, geometry, withRivers) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const surfaceProgram = createProgram(gl, WATER_VERTEX_SHADER, WATER_SURFACE_FRAGMENT_SHADER);
  const coastlineProgram = createProgram(gl, WATER_VERTEX_SHADER, COASTLINE_FRAGMENT_SHADER);
  const riverProgram = withRivers ? createProgram(gl, RIVER_VERTEX_SHADER, RIVER_FRAGMENT_SHADER) : null;
  const maskTexture = createTexture(gl, maskCanvas, true);
  const normalMap = createNormalMap(gl);
  const quad = createQuad(gl);
  const rivers = withRivers ? createRiverBuffers(gl, geometry) : null;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return {
    gl,
    canvas,
    maskTexture,
    normalMap,
    quad,
    rivers,
    surfaceProgram,
    coastlineProgram,
    riverProgram,
    surfaceCameraUniforms: getUniforms(gl, surfaceProgram, ["uCameraCenter", "uViewSize", "uViewportScale"]),
    coastlineCameraUniforms: getUniforms(gl, coastlineProgram, ["uCameraCenter", "uViewSize", "uViewportScale"]),
    riverCameraUniforms: riverProgram ? getUniforms(gl, riverProgram, ["uCameraCenter", "uViewSize", "uViewportScale"]) : null,
    surfaceUniforms: getUniforms(gl, surfaceProgram, [
      "uPhysicalMask", "uNormalMap", "uTime", "uSurfaceMode", "uOpacity",
      "uOceanColor", "uSeaColor", "uLakeColor", "uReflectionColor", "uRoughness",
    ]),
    coastlineUniforms: getUniforms(gl, coastlineProgram, ["uPhysicalMask", "uTime"]),
    riverUniforms: riverProgram ? getUniforms(gl, riverProgram, [
      "uPhysicalMask", "uNormalMap", "uTime", "uFlowSpeed", "uRiverColor", "uFoamColor",
    ]) : null,
    surfaceAttributes: {
      position: gl.getAttribLocation(surfaceProgram, "aPosition"),
      uv: gl.getAttribLocation(surfaceProgram, "aUv"),
    },
    coastlineAttributes: {
      position: gl.getAttribLocation(coastlineProgram, "aPosition"),
      uv: gl.getAttribLocation(coastlineProgram, "aUv"),
    },
    riverAttributes: riverProgram ? {
      position: gl.getAttribLocation(riverProgram, "aPosition"),
      flow: gl.getAttribLocation(riverProgram, "aFlow"),
      side: gl.getAttribLocation(riverProgram, "aSide"),
      uv: gl.getAttribLocation(riverProgram, "aUv"),
      width: gl.getAttribLocation(riverProgram, "aWidth"),
      depth: gl.getAttribLocation(riverProgram, "aDepth"),
    } : null,
  };
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

function setCameraUniforms(gl, uniforms, camera, pixelSize) {
  const zoom = Math.max(1, Number(camera?.zoom ?? 1));
  const viewWidth = 360 / zoom;
  const viewHeight = 180 / zoom;
  const mapScale = Math.min(pixelSize.width / viewWidth, pixelSize.height / viewHeight);
  const viewportScale = [
    (viewWidth * mapScale) / pixelSize.width,
    (viewHeight * mapScale) / pixelSize.height,
  ];
  gl.uniform2f(uniforms.cameraCenter, Number(camera?.x ?? 0), Number(camera?.y ?? 0));
  gl.uniform2f(uniforms.viewSize, viewWidth, viewHeight);
  gl.uniform2f(uniforms.viewportScale, viewportScale[0], viewportScale[1]);
}

function bindQuad(state, attributes) {
  const gl = state.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, state.quad.buffer);
  gl.enableVertexAttribArray(attributes.position);
  gl.vertexAttribPointer(attributes.position, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(attributes.uv);
  gl.vertexAttribPointer(attributes.uv, 2, gl.FLOAT, false, 16, 8);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function renderSurface(state, camera, time, mode, colors) {
  const { gl } = state;
  const pixelSize = resizeCanvas(state.canvas, state.canvas.clientWidth, state.canvas.clientHeight);
  gl.viewport(0, 0, pixelSize.width, pixelSize.height);
  gl.useProgram(state.surfaceProgram);
  setCameraUniforms(gl, state.surfaceCameraUniforms, camera, pixelSize);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.maskTexture);
  gl.uniform1i(state.surfaceUniforms.physicalMask, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, state.normalMap);
  gl.uniform1i(state.surfaceUniforms.normalMap, 1);
  gl.uniform1f(state.surfaceUniforms.time, time);
  gl.uniform1f(state.surfaceUniforms.surfaceMode, mode);
  gl.uniform1f(state.surfaceUniforms.opacity, 0.92);
  gl.uniform3f(state.surfaceUniforms.oceanColor, ...colors.ocean);
  gl.uniform3f(state.surfaceUniforms.seaColor, ...colors.sea);
  gl.uniform3f(state.surfaceUniforms.lakeColor, ...colors.lake);
  gl.uniform3f(state.surfaceUniforms.reflectionColor, ...colors.reflection);
  gl.uniform1f(state.surfaceUniforms.roughness, 0.34);
  bindQuad(state, state.surfaceAttributes);
  gl.drawArrays(gl.TRIANGLES, 0, state.quad.count);
}

function renderCoastline(state, camera, time) {
  const { gl } = state;
  const pixelSize = resizeCanvas(state.canvas, state.canvas.clientWidth, state.canvas.clientHeight);
  gl.viewport(0, 0, pixelSize.width, pixelSize.height);
  gl.useProgram(state.coastlineProgram);
  setCameraUniforms(gl, state.coastlineCameraUniforms, camera, pixelSize);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.maskTexture);
  gl.uniform1i(state.coastlineUniforms.physicalMask, 0);
  gl.uniform1f(state.coastlineUniforms.time, time);
  bindQuad(state, state.coastlineAttributes);
  gl.drawArrays(gl.TRIANGLES, 0, state.quad.count);
}

function renderRivers(state, camera, time) {
  if (!state.rivers || !state.riverProgram) return;
  const { gl } = state;
  const pixelSize = resizeCanvas(state.canvas, state.canvas.clientWidth, state.canvas.clientHeight);
  gl.viewport(0, 0, pixelSize.width, pixelSize.height);
  gl.useProgram(state.riverProgram);
  setCameraUniforms(gl, state.riverCameraUniforms, camera, pixelSize);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.maskTexture);
  gl.uniform1i(state.riverUniforms.physicalMask, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, state.normalMap);
  gl.uniform1i(state.riverUniforms.normalMap, 1);
  gl.uniform1f(state.riverUniforms.time, time);
  gl.uniform1f(state.riverUniforms.flowSpeed, 0.65);
  gl.uniform3f(state.riverUniforms.riverColor, ...SURFACE_COLORS.river);
  gl.uniform3f(state.riverUniforms.foamColor, ...SURFACE_COLORS.foam);

  const a = state.riverAttributes;
  gl.bindBuffer(gl.ARRAY_BUFFER, state.rivers.vertexBuffer);
  gl.enableVertexAttribArray(a.position);
  gl.vertexAttribPointer(a.position, 2, gl.FLOAT, false, 32, 0);
  gl.enableVertexAttribArray(a.flow);
  gl.vertexAttribPointer(a.flow, 2, gl.FLOAT, false, 32, 8);
  gl.enableVertexAttribArray(a.side);
  gl.vertexAttribPointer(a.side, 1, gl.FLOAT, false, 32, 16);
  gl.enableVertexAttribArray(a.uv);
  gl.vertexAttribPointer(a.uv, 1, gl.FLOAT, false, 32, 20);
  gl.enableVertexAttribArray(a.width);
  gl.vertexAttribPointer(a.width, 1, gl.FLOAT, false, 32, 24);
  gl.enableVertexAttribArray(a.depth);
  gl.vertexAttribPointer(a.depth, 1, gl.FLOAT, false, 32, 28);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.rivers.indexBuffer);
  gl.drawElements(gl.TRIANGLES, state.rivers.indexCount, gl.UNSIGNED_INT, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function destroyContext(state) {
  if (!state) return;
  const { gl } = state;
  [state.surfaceProgram, state.coastlineProgram, state.riverProgram].forEach((program) => {
    if (program) gl.deleteProgram(program);
  });
  [state.maskTexture, state.normalMap].forEach((texture) => {
    if (texture) gl.deleteTexture(texture);
  });
  if (state.quad?.buffer) gl.deleteBuffer(state.quad.buffer);
  if (state.rivers) {
    gl.deleteBuffer(state.rivers.vertexBuffer);
    gl.deleteBuffer(state.rivers.indexBuffer);
  }
}

function WaterCanvas({ canvasRef, zIndex }) {
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="map-water-engine-layer"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex,
      }}
    />
  );
}

function WaterRenderer({ camera }) {
  const backgroundCanvasRef = useRef(null);
  const foregroundCanvasRef = useRef(null);
  const cameraRef = useRef(camera);
  const geometry = useMemo(() => buildRiverRibbonGeometry(ANATOLIA_PHYSICAL_ATLAS_RUNTIME.rivers), []);
  const maskCanvas = useMemo(() => buildPhysicalWaterMask(), []);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    if (!maskCanvas) return undefined;
    const backgroundCanvas = backgroundCanvasRef.current;
    const foregroundCanvas = foregroundCanvasRef.current;
    if (!backgroundCanvas || !foregroundCanvas) return undefined;

    const background = setupContext(backgroundCanvas, maskCanvas, geometry, false);
    const foreground = setupContext(foregroundCanvas, maskCanvas, geometry, true);
    if (!background || !foreground) {
      destroyContext(background);
      destroyContext(foreground);
      return undefined;
    }

    let frameId = 0;
    const frame = (timestamp) => {
      const time = timestamp * 0.001;
      const cameraState = cameraRef.current;
      [background, foreground].forEach((state) => {
        state.gl.clearColor(0, 0, 0, 0);
        state.gl.clear(state.gl.COLOR_BUFFER_BIT);
      });
      renderSurface(background, cameraState, time, 0, SURFACE_COLORS);
      renderSurface(foreground, cameraState, time, 1, SURFACE_COLORS);
      renderCoastline(foreground, cameraState, time);
      renderRivers(foreground, cameraState, time);
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      destroyContext(background);
      destroyContext(foreground);
    };
  }, [geometry, maskCanvas]);

  if (!maskCanvas) return null;
  return (
    <>
      <WaterCanvas canvasRef={backgroundCanvasRef} zIndex={0} />
      <WaterCanvas canvasRef={foregroundCanvasRef} zIndex={3} />
    </>
  );
}

export default WaterRenderer;
