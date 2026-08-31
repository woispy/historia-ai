/**
 * Historia AI — GPU map compositor v2.
 *
 * Owns the hot render loop. React is deliberately absent from the rendering
 * path. WebGL2 is the stable production backend; a future WebGPU backend can
 * implement the same renderer-neutral lifecycle without touching gameplay/UI.
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
  float yaw = radians(uYaw);
  float pitch = radians(uPitch);
  vec2 rotated = vec2(
    p.x * cos(yaw) - p.y * sin(yaw),
    p.x * sin(yaw) + p.y * cos(yaw)
  );
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
  constructor(canvas) {
    this.canvas = canvas;
    this.disposed = false;
    this.frame = 0;
    this.state = null;
    this.camera = { x: 0, y: 0, zoom: 1, pitch: 24, yaw: 0 };
    this.hoveredRasterId = 0;
    this.selectedRasterId = 0;
  }

  initialize({ provinceSource, landSource, palette, provinceIds = [] }) {
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
    const pickProgram = linkProgram(gl, VERTEX_SHADER, PICK_FRAGMENT_SHADER);
    const quad = createQuad(gl);
    const provinceTexture = createSourceTexture(gl, provinceSource, gl.NEAREST);
    const landTexture = createSourceTexture(gl, landSource, gl.NEAREST);
    const paletteTexture = createPaletteTexture(gl, palette);
    const fbo = createPickFramebuffer(gl, Math.max(1, this.canvas.width), Math.max(1, this.canvas.height));

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
      fbo,
      uniforms: getUniforms(gl, program),
      pickUniforms: getUniforms(gl, pickProgram),
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
    this.hoveredRasterId = Number(rasterId) >>> 0;
  }

  lookupRasterId(provinceId) {
    const ids = this.state?.provinceIds;
    if (!ids || !provinceId) return 0;
    for (let index = 1; index < ids.length; index += 1) {
      if (String(ids[index]) === String(provinceId)) return index;
    }
    return 0;
  }

  resize(cssWidth, cssHeight) {
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.resizePickTarget(width, height);
  }

  render() {
    if (this.disposed || !this.state) return;
    const gl = this.state.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.03, 0.05, 0.055, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawProgram(this.state, this.camera, this.selectedRasterId, this.hoveredRasterId);
    this.frame += 1;
  }

  start() {
    if (this.frameRequest) return;
    const loop = () => {
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
    if (!this.state) return null;
    const { gl, fbo, pickProgram } = this.state;
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) * this.canvas.width / Math.max(1, rect.width));
    const y = Math.floor((rect.bottom - clientY) * this.canvas.height / Math.max(1, rect.height));
    if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) return null;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(pickProgram);
    setCameraUniforms(gl, this.state.pickUniforms, this.camera);
    bindQuad(this.state);
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
    const gl = state.gl;
    gl.deleteTexture(state.paletteTexture);
    gl.deleteTexture(state.provinceTexture);
    gl.deleteTexture(state.landTexture);
    gl.deleteTexture(state.fbo.texture);
    gl.deleteFramebuffer(state.fbo.framebuffer);
    gl.deleteBuffer(state.quad.buffer);
    gl.deleteProgram(state.program);
    gl.deleteProgram(state.pickProgram);
    this.state = null;
  }

  resizePickTarget(width, height) {
    const fbo = this.state?.fbo;
    if (!fbo) return;
    const gl = this.state.gl;
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
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

function setCameraUniforms(gl, uniforms, camera) {
  gl.uniform2f(uniforms.cameraCenter, Number(camera.x) || 0, Number(camera.y) || 0);
  gl.uniform1f(uniforms.zoom, Math.max(0.001, Number(camera.zoom) || 1));
  gl.uniform1f(uniforms.pitch, Number(camera.pitch) || 24);
  gl.uniform1f(uniforms.yaw, Number(camera.yaw) || 0);
}

function bindQuad(state) {
  const gl = state.gl;
  const program = gl.getParameter(gl.CURRENT_PROGRAM);
  const position = gl.getAttribLocation(program, "aPosition");
  const uv = gl.getAttribLocation(program, "aUv");
  gl.bindBuffer(gl.ARRAY_BUFFER, state.quad.buffer);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(uv);
  gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);
}

function drawProgram(state, camera, selected, hovered) {
  const gl = state.gl;
  gl.useProgram(state.program);
  setCameraUniforms(gl, state.uniforms, camera);
  gl.uniform1f(state.uniforms.paletteSize, state.paletteSize);
  gl.uniform1f(state.uniforms.selectedId, selected);
  gl.uniform1f(state.uniforms.hoveredId, hovered);
  gl.uniform4f(state.uniforms.selectionColor, 0.84, 0.69, 0.30, 1);
  gl.uniform4f(state.uniforms.hoverColor, 1, 0.88, 0.45, 1);
  gl.uniform4f(state.uniforms.landColor, 0.36, 0.39, 0.34, 1);
  gl.uniform4f(state.uniforms.waterColor, 0.08, 0.15, 0.19, 1);
  bindQuad(state);
  bindTexture(gl, state.provinceTexture, 0, state.uniforms.provinceIds);
  bindTexture(gl, state.landTexture, 1, state.uniforms.landMask);
  bindTexture(gl, state.paletteTexture, 2, state.uniforms.palette);
  gl.drawArrays(gl.TRIANGLES, 0, state.quad.count);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function bindTexture(gl, texture, unit, uniform) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uniform, unit);
}

export default GpuMapRenderer;
