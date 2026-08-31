const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in vec2 a_position;
layout(location = 1) in uint a_provinceIndex;

uniform vec2 u_camera;
uniform vec2 u_viewport;
uniform float u_zoom;
uniform uint u_selectedProvince;

flat out uint v_provinceIndex;

void main() {
  vec2 halfView = u_viewport / (2.0 * u_zoom);
  vec2 world = (a_position - u_camera) / halfView;
  gl_Position = vec4(world, 0.0, 1.0);
  v_provinceIndex = a_provinceIndex;
}`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;
precision highp int;

flat in uint v_provinceIndex;
uniform vec4 u_defaultColor;
uniform vec4 u_selectedColor;
uniform uint u_selectedProvince;

out vec4 outColor;

void main() {
  outColor = v_provinceIndex == u_selectedProvince
    ? u_selectedColor
    : u_defaultColor;
}`;

function assertWebGl2(gl) {
  if (!gl) throw new Error("Historia AI province geometry requires WebGL2.");
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "unknown shader compilation error";
    gl.deleteShader(shader);
    throw new Error(`Province GPU shader compilation failed: ${log}`);
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create province GPU program.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "unknown program link error";
    gl.deleteProgram(program);
    throw new Error(`Province GPU program link failed: ${log}`);
  }
  return program;
}

function parseHexColor(hex, fallback) {
  const value = String(hex ?? "").replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return fallback;
  return [
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255,
    1,
  ];
}

/**
 * Creates a stateful WebGL2 renderer for a packed province geometry buffer.
 * The renderer owns only GPU resources; source geometry remains in the runtime
 * repository and can be rebuilt independently when the historical asset changes.
 */
export function createProvinceGpuRenderer(canvas) {
  if (!canvas) throw new Error("Province GPU renderer requires a canvas.");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    depth: false,
    stencil: false,
  });
  assertWebGl2(gl);

  const program = createProgram(gl);
  const vao = gl.createVertexArray();
  const positionBuffer = gl.createBuffer();
  const provinceIndexBuffer = gl.createBuffer();
  if (!vao || !positionBuffer || !provinceIndexBuffer) {
    throw new Error("Unable to allocate province GPU buffers.");
  }

  const cameraLocation = gl.getUniformLocation(program, "u_camera");
  const viewportLocation = gl.getUniformLocation(program, "u_viewport");
  const zoomLocation = gl.getUniformLocation(program, "u_zoom");
  const selectedLocation = gl.getUniformLocation(program, "u_selectedProvince");
  const defaultColorLocation = gl.getUniformLocation(program, "u_defaultColor");
  const selectedColorLocation = gl.getUniformLocation(program, "u_selectedColor");

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, provinceIndexBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_INT, 0, 0);
  gl.bindVertexArray(null);

  let vertexCount = 0;

  return {
    upload(geometry) {
      if (!geometry?.positions || !geometry?.provinceIndices) {
        throw new Error("Province GPU renderer received an invalid geometry buffer.");
      }
      if (geometry.positions.length !== geometry.provinceIndices.length * 2) {
        throw new Error("Province GPU position/index buffer lengths do not match.");
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, provinceIndexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.provinceIndices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      vertexCount = geometry.provinceIndices.length;
      return vertexCount;
    },

    resize(width, height, devicePixelRatio = 1) {
      const safeRatio = Math.max(1, Number(devicePixelRatio) || 1);
      canvas.width = Math.max(1, Math.round(width * safeRatio));
      canvas.height = Math.max(1, Math.round(height * safeRatio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    },

    render({ camera = {}, width, height, zoom = 1, selectedProvinceIndex = -1, color, selectedColor } = {}) {
      if (!vertexCount) return;
      const safeWidth = Math.max(1, Number(width) || canvas.clientWidth || canvas.width);
      const safeHeight = Math.max(1, Number(height) || canvas.clientHeight || canvas.height);
      const safeZoom = Math.max(0.0001, Number(zoom) || 1);
      const selected = Number.isInteger(selectedProvinceIndex) && selectedProvinceIndex >= 0
        ? selectedProvinceIndex
        : 0xffffffff;

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(cameraLocation, Number(camera.x) || 0, Number(camera.y) || 0);
      gl.uniform2f(viewportLocation, safeWidth, safeHeight);
      gl.uniform1f(zoomLocation, safeZoom);
      gl.uniform1ui(selectedLocation, selected);
      gl.uniform4fv(defaultColorLocation, parseHexColor(color, [0.43, 0.46, 0.37, 1]));
      gl.uniform4fv(selectedColorLocation, parseHexColor(selectedColor, [0.84, 0.69, 0.30, 1]));

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
      gl.bindVertexArray(null);
    },

    dispose() {
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(provinceIndexBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },

    gl,
  };
}

export function getProvinceGpuShaderSources() {
  return Object.freeze({
    vertex: VERTEX_SHADER_SOURCE,
    fragment: FRAGMENT_SHADER_SOURCE,
  });
}
