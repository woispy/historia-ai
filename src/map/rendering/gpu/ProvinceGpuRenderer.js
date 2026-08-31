const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in vec2 a_position;
layout(location = 1) in uint a_provinceIndex;
layout(location = 2) in vec4 a_color;

uniform vec2 u_camera;
uniform vec2 u_viewportWorld;
uniform uint u_selectedProvince;

flat out uint v_provinceIndex;
out vec4 v_color;

void main() {
  vec2 world = (a_position - u_camera) / u_viewportWorld;
  gl_Position = vec4(world.x, -world.y, 0.0, 1.0);
  v_provinceIndex = a_provinceIndex;
  v_color = a_color;
}`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;
precision highp int;

flat in uint v_provinceIndex;
in vec4 v_color;
uniform vec4 u_selectedColor;
uniform uint u_selectedProvince;

out vec4 outColor;

void main() {
  outColor = v_provinceIndex == u_selectedProvince
    ? u_selectedColor
    : v_color;
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

/**
 * Returns the half-extents of the finite SVG world in world coordinates.
 *
 * SvgRenderer uses preserveAspectRatio="xMidYMid meet", which preserves the
 * complete 360x180 world on every canvas aspect ratio. The GPU layer therefore
 * uses the same fixed world extents rather than deriving Y extent from the
 * physical canvas height. This prevents square/tall canvases from vertically
 * stretching province geometry relative to the authoritative SVG layers.
 */
export function getGpuViewportWorld(width, height, zoom = 1) {
  void width;
  void height;
  const safeZoom = Math.max(0.0001, Number(zoom) || 1);
  return [180 / safeZoom, 90 / safeZoom];
}

/** Creates a stateful WebGL2 renderer for a packed province geometry buffer. */
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
  const colorBuffer = gl.createBuffer();
  if (!vao || !positionBuffer || !provinceIndexBuffer || !colorBuffer) {
    throw new Error("Unable to allocate province GPU buffers.");
  }

  const cameraLocation = gl.getUniformLocation(program, "u_camera");
  const viewportWorldLocation = gl.getUniformLocation(program, "u_viewportWorld");
  const selectedLocation = gl.getUniformLocation(program, "u_selectedProvince");
  const selectedColorLocation = gl.getUniformLocation(program, "u_selectedColor");

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, provinceIndexBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_INT, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 0, 0);
  gl.bindVertexArray(null);

  let vertexCount = 0;

  return {
    upload(geometry) {
      if (!geometry?.positions || !geometry?.provinceIndices || !geometry?.colors) {
        throw new Error("Province GPU renderer received an invalid geometry buffer.");
      }
      if (geometry.positions.length !== geometry.provinceIndices.length * 2) {
        throw new Error("Province GPU position/index buffer lengths do not match.");
      }
      if (geometry.colors.length !== geometry.provinceIndices.length * 4) {
        throw new Error("Province GPU color/index buffer lengths do not match.");
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, provinceIndexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.provinceIndices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.colors, gl.STATIC_DRAW);
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

    render({ camera = {}, width, height, zoom = 1, selectedProvinceIndex = -1, selectedColor = "#d6b04d" } = {}) {
      if (!vertexCount) return;
      const viewportWorld = getGpuViewportWorld(width, height, zoom);
      const selected = Number.isInteger(selectedProvinceIndex) && selectedProvinceIndex >= 0
        ? selectedProvinceIndex
        : 0xffffffff;
      const value = String(selectedColor).replace(/^#/, "");
      const selectedRgba = /^[0-9a-f]{6}$/i.test(value)
        ? [
          Number.parseInt(value.slice(0, 2), 16) / 255,
          Number.parseInt(value.slice(2, 4), 16) / 255,
          Number.parseInt(value.slice(4, 6), 16) / 255,
          1,
        ]
        : [0.84, 0.69, 0.30, 1];

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(cameraLocation, Number(camera.x) || 0, Number(camera.y) || 0);
      gl.uniform2f(viewportWorldLocation, viewportWorld[0], viewportWorld[1]);
      gl.uniform1ui(selectedLocation, selected);
      gl.uniform4fv(selectedColorLocation, selectedRgba);

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
      gl.deleteBuffer(colorBuffer);
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
