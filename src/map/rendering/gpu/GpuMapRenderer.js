/**
 * Historia AI — GPU map compositor v2.
 *
 * This class owns the hot render loop. React is intentionally absent from the
 * rendering path: camera motion, hover and picking update GPU resources only.
 * WebGL2 is the stable baseline; the public API is backend-neutral so a WebGPU
 * backend can replace it without changing map/gameplay code.
 */

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
  p.x *= cos(radians(uYaw));
  p.y = p.y * cos(radians(uPitch)) - p.x * sin(radians(uYaw)) * 0.08;
  vec2 view = vec2(360.0 / max(uZoom, 0.001), 180.0 / max(uZoom, 0.001));
  vec2 ndc = p / (view * 0.5);
  gl_Position = vec4(ndc, 0.0, 1.0);
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
  if (land < 0.5) {
    outColor = uWaterColor;
    return;
  }
  float id = decodeId(texture(uProvinceIds, vUv));
  if (id < 0.5) {
    outColor = uLandColor;
    return;
  }
  vec2 paletteUv = vec2((id - 0.5) / max(uPaletteSize, 1.0), 0.5);
  vec4 color = texture(uPalette, paletteUv);
  if (abs(id - uSelectedId) < 0.5) color = mix(color, uSelectionColor, 0.68);
  else if (abs(id - uHoveredId) < 0.5) color = mix(color, uHoverColor, 0.42);
  outColor = color;
}`;

const PICK_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uProvinceIds;
in vec2 vUv;
out vec4 outColor;
void main() { outColor = texture(uProvinceIds, vUv); }`;

export class GpuMapRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = options;
    this.disposed = false;
    this.frame = 0;
    this.lastTime = 0;
    this.state = null;
    this.camera = { x: 0, y: 0, zoom: 1, pitch: 24, yaw: 0 };
    this.hoveredRasterId = 0;
    this.selectedRasterId = 0;
  }

  initialize({ provinceTexture, landTexture, palette, provinceIds = [] }) {
    const gl = this.canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    if (!gl) return false;

    const program = linkProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    const pickProgram = linkProgram(gl, VERTEX_SHADER, PICK_FRAGMENT_SHADER);
    const quad = createQuad(gl);
    const paletteTexture = createPaletteTexture(gl, palette);
    const fbo = createPickFramebuffer(gl, this.canvas.width || 1, this.canvas.height || 1);

    this.state = {
      gl,
      program,
      pickProgram,
      quad,
      provinceTexture,
      landTexture,
      paletteTexture,
      provinceIds,
      fbo,
      uniforms: getUniforms(gl, program),
      pickUniforms: getUniforms(gl, pickProgram),
      paletteSize: Math.max(1, palette.length / 4),
    };
    return true;
  }

  setCamera(camera) {
    this.camera = { ...this.camera, ...camera };
  }

  setSelectedProvinceId(provinceId) {
    this.selectedRasterId = this.lookupRasterId(provinceId);
  }

  setHoveredRasterId(rasterId) {
    this.hoveredRasterId = rasterId >>> 0;
  }

  lookupRasterId(provinceId) {
    const ids = this.state?.provinceIds;
    if (!ids || !provinceId) return 0;
    const index = ids.indexOf(provinceId);
    return index > 0 ? index : 0;
  }

  resize(cssWidth, cssHeight) {
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.resizePickTarget(width, height);
    }
  }

  render(now = performance.now()) {
    if (this.disposed || !this.state) return;
    const gl = this.state.gl;
    const dt = this.lastTime ? Math.min(0.05, (now - this.lastTime) / 1000) : 0;
    this.lastTime = now;
    this.camera = this.options.cameraRig?.tick(dt) ?? this.camera;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.03, 0.05, 0.055, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawProgram(this.state, this.camera, this.selectedRasterId, this.hoveredRasterId);
    this.frame += 1;
  }

  start() {
    if (this.frameRequest) return;
    const loop = (time) => {
      this.frameRequest = requestAnimationFrame(loop);
      this.render(time);
    };
    this.frameRequest = requestAnimationFrame(loop);
  }

  stop() {
    if (!this.frameRequest) return;
    cancelAnimationFrame(this.frameRequest);
    this.frameRequest = 0;
  }

  pick(clientX, clientY) {
    if (!this.state) return null;
    const { gl, fbo, pickProgram } = this.state;
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) * this.canvas.width / Math.max(1, rect.width));
    const y = Math.floor((rect.bottom - clientY) * this.canvas.height / Math.max(1, rect.height));
    if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) return null;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(pickProgram);
    setCameraUniforms(this.state.pickUniforms, this.camera);
    bindQuad(this.state, this.state.pickUniforms);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.state.provinceTexture);
    gl.uniform1i(this.state.pickUniforms.provinceIds, 0);
    gl.drawArrays(gl.TRIANGLES, 0, this.state.quad.count);

    const pixel = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const rasterId = pixel[0] | (pixel[1] << 8) | (pixel[2] << 16);
    return rasterId > 0 ? this.state.provinceIds[rasterId] ?? null : null;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    const state = this.state;
    if (!state) return;
    const { gl } = state;
    gl.deleteTexture(state.paletteTexture);
    gl.deleteTexture(state.provinceTexture);
    gl.deleteTexture(state.landTexture);
    gl.deleteFramebuffer(state.fbo.framebuffer);
    gl.deleteTexture(state.fbo.texture);
    gl.deleteBuffer(state.quad.buffer);
    gl.deleteProgram(state.program);
    gl.deleteProgram(state.pickProgram);
    this.state = null;
  }

  resizePickTarget(width, height) {
    const fbo = this.state?.fbo;
    if (!fbo) return;
    const { gl } = this.state;
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function linkProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create GPU program");
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Program linking failed";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
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
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return { buffer, count: 6 };
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

function createPickFramebuffer(gl, width, height) {
  const framebuffer = gl.createFramebuffer();
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
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
  };
}

function setCameraUniforms(uniforms, camera) {
  const gl = currentGl;
  if (!gl) return;
  gl.uniform2f(uniforms.cameraCenter, camera.x, camera.y);
  gl.uniform1f(uniforms.zoom, camera.zoom);
  gl.uniform1f(uniforms.pitch, camera.pitch ?? 24);
  gl.uniform1f(uniforms.yaw, camera.yaw ?? 0);
}

let currentGl = null;
function bindQuad(state, uniforms) {
  const gl = state.gl;
  currentGl = gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, state.quad.buffer);
  const position = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "aPosition");
  const uv = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "aUv");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(uv);
  gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);
}

function drawProgram(state, camera, selected, hovered) {
  const gl = state.gl;
  gl.useProgram(state.program);
  setCameraUniformsWithGl(gl, state.uniforms, camera);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.provinceTexture);
  gl.uniform1i(state.uniforms.provinceIds, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, state.landTexture);
  gl.uniform1i(state.uniforms.landMask, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, state.paletteTexture);
  gl.uniform1i(state.uniforms.palette, 2);
  gl.uniform1f(state.uniforms.paletteSize, state.paletteSize);
  gl.uniform1f(state.uniforms.selectedId, selected);
  gl.uniform1f(state.uniforms.hoveredId, hovered);
  gl.uniform4f(state.uniforms.selectionColor, 0.84, 0.69, 0.30, 1);
  gl.uniform4f(state.uniforms.hoverColor, 1, 0.88, 0.45, 1);
  gl.uniform4f(state.uniforms.landColor, 0.36, 0.39, 0.34, 1);
  gl.uniform4f(state.uniforms.waterColor, 0.08, 0.15, 0.19, 1);
  bindQuad(state, state.uniforms);
  gl.drawArrays(gl.TRIANGLES, 0, state.quad.count);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function setCameraUniformsWithGl(gl, uniforms, camera) {
  gl.uniform2f(uniforms.cameraCenter, Number(camera.x) || 0, Number(camera.y) || 0);
  gl.uniform1f(uniforms.zoom, Math.max(0.001, Number(camera.zoom) || 1));
  gl.uniform1f(uniforms.pitch, Number(camera.pitch) || 24);
  gl.uniform1f(uniforms.yaw, Number(camera.yaw) || 0);
}

export default GpuMapRenderer;
