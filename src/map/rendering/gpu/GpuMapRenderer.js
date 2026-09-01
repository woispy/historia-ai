/**
 * Historia AI — WebGL2 map compositor.
 *
 * Transitional raster backend for the GPU-first map architecture. It owns the
 * render loop and GPU resources. Province picking uses a persistent 1x1
 * framebuffer and a direct ID-texture sample; it does not rerender the full
 * canvas on every pointer event.
 */
import { MapRendererContract } from "../MapRendererContract.js";

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 aPosition;
in vec2 aUv;
uniform vec2 uCameraCenter;
uniform float uZoom;
uniform float uPitch;
uniform float uYaw;
out vec2 vUv;
void main() {
  vec2 p = aPosition - uCameraCenter;
  float yaw = radians(uYaw);
  float pitch = radians(uPitch);
  vec2 rotated = vec2(p.x * cos(yaw) - p.y * sin(yaw), p.x * sin(yaw) + p.y * cos(yaw));
  rotated.y *= max(0.65, cos(pitch));
  vec2 view = vec2(360.0, 180.0) / max(uZoom, 0.001);
  gl_Position = vec4(rotated / (view * 0.5), 0.0, 1.0);
  vUv = aUv;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uProvinceIds;
uniform sampler2D uLandMask;
uniform sampler2D uPalette;
uniform float uPaletteSize;
uniform float uSelectedId;
uniform float uHoveredId;
uniform vec4 uSelectionColor;
uniform vec4 uHoverColor;
uniform vec4 uLandColor;
uniform vec4 uWaterColor;
in vec2 vUv;
out vec4 outColor;
float decodeId(vec4 encoded) {
  vec3 bytes = floor(encoded.rgb * 255.0 + 0.5);
  return bytes.r + bytes.g * 256.0 + bytes.b * 65536.0;
}
void main() {
  float land = texture(uLandMask, vUv).r;
  if (land < 0.5) { outColor = uWaterColor; return; }
  float id = decodeId(texture(uProvinceIds, vUv));
  if (id < 0.5) { outColor = uLandColor; return; }
  vec2 paletteUv = vec2((id - 0.5) / max(uPaletteSize, 1.0), 0.5);
  vec4 color = texture(uPalette, paletteUv);
  if (abs(id - uSelectedId) < 0.5) color = mix(color, uSelectionColor, 0.68);
  else if (abs(id - uHoveredId) < 0.5) color = mix(color, uHoverColor, 0.42);
  outColor = color;
}`;

const PICK_VERTEX_SHADER = `#version 300 es
precision highp float;
const vec2 POSITIONS[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main() { gl_Position = vec4(POSITIONS[gl_VertexID], 0.0, 1.0); }`;

const PICK_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uProvinceIds;
uniform vec2 uPickUv;
out vec4 outColor;
void main() { outColor = texture(uProvinceIds, uPickUv); }`;

export class GpuMapRenderer extends MapRendererContract {
  constructor(canvas) {
    super();
    this.canvas = canvas;
    this.disposed = false;
    this.frame = 0;
    this.frameRequest = 0;
    this.state = null;
    this.camera = { x: 0, y: 0, zoom: 1, pitch: 24, yaw: 0 };
    this.hoveredRasterId = 0;
    this.selectedRasterId = 0;
    this.pickPixel = new Uint8Array(4);
  }

  initialize({ provinceSource, landSource, palette, provinceIds = [] }) {
    if (this.disposed) throw new Error("Cannot initialize a disposed map renderer");
    if (!provinceSource || !landSource || !palette) return false;
    const gl = this.canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) return false;

    const program = linkProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    const pickProgram = linkProgram(gl, PICK_VERTEX_SHADER, PICK_FRAGMENT_SHADER);
    const quad = createQuad(gl, program);
    const provinceTexture = createSourceTexture(gl, provinceSource, gl.NEAREST);
    const landTexture = createSourceTexture(gl, landSource, gl.NEAREST);
    const paletteTexture = createPaletteTexture(gl, palette);
    const fbo = createPickFramebuffer(gl);
    const provinceIdToRasterIndex = new Map();
    for (let index = 1; index < provinceIds.length; index += 1) {
      provinceIdToRasterIndex.set(String(provinceIds[index]), index);
    }

    this.state = {
      gl,
      program,
      pickProgram,
      quad,
      provinceTexture,
      landTexture,
      paletteTexture,
      paletteSize: Math.max(1, palette.length / 4),
      provinceIds,
      provinceIdToRasterIndex,
      fbo,
      uniforms: getUniforms(gl, program),
      pickUniforms: getUniforms(gl, pickProgram),
    };
    return true;
  }

  setCamera(camera) { this.camera = { ...this.camera, ...camera }; }
  setSelectedProvinceId(provinceId) { this.selectedRasterId = this.lookupRasterId(provinceId); }
  setHoveredRasterId(rasterId) { this.hoveredRasterId = Number(rasterId) >>> 0; }

  lookupRasterId(provinceId) {
    if (!this.state || provinceId == null) return 0;
    return this.state.provinceIdToRasterIndex.get(String(provinceId)) ?? 0;
  }

  resize(cssWidth, cssHeight) {
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(Number(cssWidth) * dpr));
    const height = Math.max(1, Math.round(Number(cssHeight) * dpr));
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  render() {
    if (this.disposed || !this.state) return;
    const gl = this.state.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.03, 0.05, 0.055, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawProgram(this.state, this.camera, this.selectedRasterId, this.hoveredRasterId);
    this.frame += 1;
  }

  start() {
    if (this.disposed || this.frameRequest) return;
    const loop = () => {
      if (this.disposed) { this.frameRequest = 0; return; }
      this.render();
      this.frameRequest = requestAnimationFrame(loop);
    };
    this.frameRequest = requestAnimationFrame(loop);
  }

  stop() {
    if (this.frameRequest) cancelAnimationFrame(this.frameRequest);
    this.frameRequest = 0;
  }

  pick(clientX, clientY) {
    if (this.disposed || !this.state) return null;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const localX = (Number(clientX) - rect.left) / rect.width;
    const localY = (Number(clientY) - rect.top) / rect.height;
    if (localX < 0 || localX > 1 || localY < 0 || localY > 1) return null;
    const uv = cameraScreenToRasterUv(localX, localY, this.camera);
    if (!uv) return null;

    const { gl, fbo, pickProgram, pickUniforms, provinceTexture } = this.state;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
    gl.viewport(0, 0, 1, 1);
    gl.useProgram(pickProgram);
    gl.uniform2f(pickUniforms.pickUv, uv.x, uv.y);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, provinceTexture);
    gl.uniform1i(pickUniforms.provinceIds, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pickPixel);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const rasterId = this.pickPixel[0] | (this.pickPixel[1] << 8) | (this.pickPixel[2] << 16);
    return rasterId > 0 ? this.state.provinceIds[rasterId] ?? null : null;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    const state = this.state;
    this.state = null;
    if (!state) return;
    const gl = state.gl;
    gl.deleteTexture(state.paletteTexture);
    gl.deleteTexture(state.provinceTexture);
    gl.deleteTexture(state.landTexture);
    gl.deleteTexture(state.fbo.texture);
    gl.deleteFramebuffer(state.fbo.framebuffer);
    gl.deleteVertexArray(state.quad.vao);
    gl.deleteBuffer(state.quad.buffer);
    gl.deleteProgram(state.program);
    gl.deleteProgram(state.pickProgram);
  }
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("GPU shader allocation failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "GPU shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function linkProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  if (!program) throw new Error("GPU program allocation failed");
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "GPU program linking failed";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function createQuad(gl, program) {
  const vertices = new Float32Array([-180,-90,0,1, 180,-90,1,1, 180,90,1,0, -180,-90,0,1, 180,90,1,0, -180,90,0,0]);
  const buffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  if (!buffer || !vao) throw new Error("GPU quad allocation failed");
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPosition");
  const uv = gl.getAttribLocation(program, "aUv");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(uv);
  gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return { buffer, vao, count: 6 };
}

function createSourceTexture(gl, source, filter) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

function createPaletteTexture(gl, palette) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, palette.length / 4, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, palette);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

function createPickFramebuffer(gl) {
  const framebuffer = gl.createFramebuffer();
  const texture = gl.createTexture();
  if (!framebuffer || !texture) throw new Error("Picking framebuffer allocation failed");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 1, 1);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Picking framebuffer incomplete");
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return { framebuffer, texture };
}

function getUniforms(gl, program) {
  return {
    cameraCenter: gl.getUniformLocation(program, "uCameraCenter"),
    zoom: gl.getUniformLocation(program, "uZoom"),
    pitch: gl.getUniformLocation(program, "uPitch"),
    yaw: gl.getUniformLocation(program, "uYaw"),
    provinceIds: gl.getUniformLocation(program, "uProvinceIds"),
    landMask: gl.getUniformLocation(program, "uLandMask"),
    palette: gl.getUniformLocation(program, "uPalette"),
    paletteSize: gl.getUniformLocation(program, "uPaletteSize"),
    selectedId: gl.getUniformLocation(program, "uSelectedId"),
    hoveredId: gl.getUniformLocation(program, "uHoveredId"),
    selectionColor: gl.getUniformLocation(program, "uSelectionColor"),
    hoverColor: gl.getUniformLocation(program, "uHoverColor"),
    landColor: gl.getUniformLocation(program, "uLandColor"),
    waterColor: gl.getUniformLocation(program, "uWaterColor"),
    pickUv: gl.getUniformLocation(program, "uPickUv"),
  };
}

function setCameraUniforms(gl, uniforms, camera) {
  gl.uniform2f(uniforms.cameraCenter, Number(camera.x) || 0, Number(camera.y) || 0);
  gl.uniform1f(uniforms.zoom, Math.max(0.001, Number(camera.zoom) || 1));
  gl.uniform1f(uniforms.pitch, Number(camera.pitch) || 24);
  gl.uniform1f(uniforms.yaw, Number(camera.yaw) || 0);
}

function drawProgram(state, camera, selected, hovered) {
  const gl = state.gl;
  gl.useProgram(state.program);
  gl.bindVertexArray(state.quad.vao);
  setCameraUniforms(gl, state.uniforms, camera);
  gl.uniform1f(state.uniforms.paletteSize, state.paletteSize);
  gl.uniform1f(state.uniforms.selectedId, selected);
  gl.uniform1f(state.uniforms.hoveredId, hovered);
  gl.uniform4f(state.uniforms.selectionColor, 0.95, 0.78, 0.18, 1);
  gl.uniform4f(state.uniforms.hoverColor, 1, 1, 1, 1);
  gl.uniform4f(state.uniforms.landColor, 0.24, 0.28, 0.24, 1);
  gl.uniform4f(state.uniforms.waterColor, 0.04, 0.10, 0.15, 1);
  bindTexture(gl, state.provinceTexture, 0, state.uniforms.provinceIds);
  bindTexture(gl, state.landTexture, 1, state.uniforms.landMask);
  bindTexture(gl, state.paletteTexture, 2, state.uniforms.palette);
  gl.drawArrays(gl.TRIANGLES, 0, state.quad.count);
  gl.bindVertexArray(null);
}

function bindTexture(gl, texture, unit, uniform) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uniform, unit);
}

function cameraScreenToRasterUv(localX, localY, camera) {
  const zoom = Math.max(0.001, Number(camera.zoom) || 1);
  const pitch = (Number(camera.pitch) || 24) * Math.PI / 180;
  const yaw = (Number(camera.yaw) || 0) * Math.PI / 180;
  const cosPitch = Math.max(0.65, Math.cos(pitch));
  const ndcX = localX * 2 - 1;
  const ndcY = 1 - localY * 2;
  const viewX = 360 / zoom;
  const viewY = 180 / zoom;
  const rotatedX = ndcX * viewX * 0.5;
  const rotatedY = (ndcY * viewY * 0.5) / cosPitch;
  const worldX = rotatedX * Math.cos(yaw) + rotatedY * Math.sin(yaw) + (Number(camera.x) || 0);
  const worldY = -rotatedX * Math.sin(yaw) + rotatedY * Math.cos(yaw) + (Number(camera.y) || 0);
  if (worldX < -180 || worldX > 180 || worldY < -90 || worldY > 90) return null;
  return { x: Math.min(1, Math.max(0, (worldX + 180) / 360)), y: Math.min(1, Math.max(0, (90 - worldY) / 180)) };
}

export default GpuMapRenderer;
