import { WORLD_LAND_POLYGONS } from "../../physical/WorldPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../data/AnatoliaPhysicalAtlasRuntime.js";
import { triangulatePolygon } from "./BinaryMapRenderer.js";

const VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
uniform vec2 uCameraCenter; uniform float uZoom; uniform float uPitch; uniform float uYaw;
void main(){vec2 p=aPosition-uCameraCenter;float y=radians(uYaw);float pch=radians(uPitch);vec2 r=vec2(p.x*cos(y)-p.y*sin(y),p.x*sin(y)+p.y*cos(y));r.y*=max(0.65,cos(pch));vec2 view=vec2(360.0,180.0)/max(uZoom,0.001);gl_Position=vec4(r/(view*0.5),0.0,1.0);}`;
const FRAGMENT = `#version 300 es
precision highp float;
uniform vec4 uColor; out vec4 outColor;
void main(){outColor=uColor;}`;

const WORLD_LAND = [0.16,0.20,0.17,1];
const TERRAIN_LOWLAND = [0.25,0.31,0.24,0.34];
const TERRAIN_PLATEAU = [0.31,0.29,0.20,0.30];
const TERRAIN_HIGHLAND = [0.26,0.25,0.22,0.34];
const LAKE = [0.10,0.31,0.37,0.92];
const RIVER = [0.30,0.61,0.66,0.86];
const RIVER_UNDER = [0.06,0.16,0.19,0.75];
const MOUNTAIN = [0.34,0.31,0.25,0.38];
const COAST = [0.58,0.70,0.67,0.72];

export class ProductionPhysicalMapLayer {
  constructor() {
    this.state = null;
    this.disposed = false;
  }

  initialize(gl) {
    if (this.disposed) throw new Error("Cannot initialize disposed physical layer");
    const program = link(gl, VERTEX, FRAGMENT);
    const fill = createGeometry(gl, buildFillGeometry());
    const coast = createGeometry(gl, buildLineGeometry(WORLD_LAND_POLYGONS));
    const terrain = createGeometry(gl, buildTerrainGeometry(ANATOLIA_PHYSICAL_ATLAS_RUNTIME.terrainRegions));
    const lakes = createGeometry(gl, buildLakeGeometry(ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes));
    const riversUnder = createGeometry(gl, buildLineGeometry(ANATOLIA_PHYSICAL_ATLAS_RUNTIME.rivers, true));
    const rivers = createGeometry(gl, buildLineGeometry(ANATOLIA_PHYSICAL_ATLAS_RUNTIME.rivers));
    const mountains = createGeometry(gl, buildLineGeometry(ANATOLIA_PHYSICAL_ATLAS_RUNTIME.mountainRanges));
    this.state = {
      gl,
      program,
      fill,
      coast,
      terrain,
      lakes,
      riversUnder,
      rivers,
      mountains,
      cameraCenter: gl.getUniformLocation(program, "uCameraCenter"),
      zoom: gl.getUniformLocation(program, "uZoom"),
      pitch: gl.getUniformLocation(program, "uPitch"),
      yaw: gl.getUniformLocation(program, "uYaw"),
      color: gl.getUniformLocation(program, "uColor"),
    };
    return true;
  }

  render(camera, width, height) {
    if (this.disposed || !this.state) return;
    const { gl, program } = this.state;
    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.uniform2f(this.state.cameraCenter, Number(camera?.x) || 0, Number(camera?.y) || 0);
    gl.uniform1f(this.state.zoom, Number(camera?.zoom) || 1);
    gl.uniform1f(this.state.pitch, Number(camera?.pitch) || 0);
    gl.uniform1f(this.state.yaw, Number(camera?.yaw) || 0);

    drawGeometry(this.state, this.state.fill, WORLD_LAND);
    drawGeometry(this.state, this.state.terrain, null);
    drawGeometry(this.state, this.state.lakes, LAKE);
    drawGeometry(this.state, this.state.riversUnder, RIVER_UNDER);
    drawGeometry(this.state, this.state.rivers, RIVER);
    drawGeometry(this.state, this.state.mountains, MOUNTAIN);
    drawGeometry(this.state, this.state.coast, COAST);
    gl.bindVertexArray(null);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const state = this.state;
    this.state = null;
    if (!state) return;
    const { gl, program } = state;
    gl.deleteProgram(program);
    for (const key of ["fill", "coast", "terrain", "lakes", "riversUnder", "rivers", "mountains"]) {
      destroyGeometry(gl, state[key]);
    }
  }
}

function buildFillGeometry() {
  const vertices = [];
  const indices = [];
  for (const polygon of WORLD_LAND_POLYGONS) {
    if (!Array.isArray(polygon) || polygon.length < 3) continue;
    const triangles = triangulatePolygon(polygon);
    if (!triangles.length) continue;
    const base = vertices.length / 2;
    for (const point of polygon) {
      vertices.push(Number(point[0]), Number(point[1]));
    }
    for (const index of triangles) indices.push(base + index);
  }
  return { vertices: Float32Array.from(vertices), indices: Uint32Array.from(indices), mode: "triangles" };
}

function buildTerrainGeometry(regions) {
  const geometries = [];
  for (const region of regions ?? []) {
    const triangles = triangulatePolygon(region.coordinates ?? []);
    if (triangles.length) geometries.push({
      ...buildPolygonGeometry(region.coordinates ?? [], triangles),
      color: region.type === "lowland" ? TERRAIN_LOWLAND : region.type === "highland" ? TERRAIN_HIGHLAND : TERRAIN_PLATEAU,
    });
  }
  return combineFillGeometries(geometries);
}

function buildLakeGeometry(lakes) {
  const geometries = [];
  for (const lake of lakes ?? []) {
    const triangles = triangulatePolygon(lake.coordinates ?? []);
    if (triangles.length) geometries.push({ ...buildPolygonGeometry(lake.coordinates ?? [], triangles), color: LAKE });
  }
  return combineFillGeometries(geometries);
}

function buildPolygonGeometry(points, triangles) {
  return {
    vertices: Float32Array.from(points.flatMap(([x, y]) => [Number(x), Number(y)])),
    indices: Uint32Array.from(triangles),
  };
}

function combineFillGeometries(geometries) {
  const vertices = [];
  const indices = [];
  const colors = [];
  for (const geometry of geometries) {
    const base = vertices.length / 2;
    vertices.push(...geometry.vertices);
    for (const index of geometry.indices) indices.push(base + index);
    colors.push(geometry.color ?? WORLD_LAND);
  }
  return { vertices: Float32Array.from(vertices), indices: Uint32Array.from(indices), mode: "triangles", groups: geometries.map((geometry, index) => ({ color: geometry.color ?? WORLD_LAND, index })) , colors };
}

function buildLineGeometry(features, under = false) {
  const vertices = [];
  for (const feature of features ?? []) {
    const coordinates = feature?.coordinates ?? feature?.rings?.[0] ?? [];
    if (!Array.isArray(coordinates) || coordinates.length < 2) continue;
    const points = under ? simplifyLine(coordinates, 2) : coordinates;
    for (let index = 1; index < points.length; index += 1) {
      const a = points[index - 1];
      const b = points[index];
      vertices.push(Number(a[0]), Number(a[1]), Number(b[0]), Number(b[1]));
    }
    if (under && points.length > 2) continue;
  }
  return { vertices: Float32Array.from(vertices), indices: null, mode: "lines" };
}

function simplifyLine(points, stride) {
  if (points.length <= 2) return points;
  const result = [points[0]];
  for (let index = stride; index < points.length - 1; index += stride) result.push(points[index]);
  result.push(points[points.length - 1]);
  return result;
}

function createGeometry(gl, data) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  const indexBuffer = data.indices ? gl.createBuffer() : null;
  if (!vao || !buffer || (data.indices && !indexBuffer)) throw new Error("Physical GPU geometry allocation failed");
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
  if (indexBuffer) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);
  }
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  return { vao, buffer, indexBuffer, count: data.indices?.length ?? data.vertices.length / 2, mode: data.mode ?? "lines", groups: data.groups ?? null };
}

function drawGeometry(state, geometry, fallbackColor) {
  if (!geometry?.count) return;
  const { gl } = state;
  gl.bindVertexArray(geometry.vao);
  if (geometry.groups?.length) {
    let vertexOffset = 0;
    for (const group of geometry.groups) {
      const source = group.index ?? 0;
      const next = geometry.groups[source + 1];
      const count = next ? next.indexStart - (group.indexStart ?? 0) : geometry.count - (group.indexStart ?? 0);
      gl.uniform4fv(state.color, group.color);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, (group.indexStart ?? 0) * 4);
      vertexOffset += count;
    }
    return;
  }
  gl.uniform4fv(state.color, fallbackColor ?? WORLD_LAND);
  if (geometry.indexBuffer) gl.drawElements(gl.TRIANGLES, geometry.count, gl.UNSIGNED_INT, 0);
  else gl.drawArrays(gl.LINES, 0, geometry.count);
}

function destroyGeometry(gl, geometry) {
  if (!geometry) return;
  gl.deleteVertexArray(geometry.vao);
  gl.deleteBuffer(geometry.buffer);
  if (geometry.indexBuffer) gl.deleteBuffer(geometry.indexBuffer);
}

function link(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program) || "Physical GPU program linking failed";
    gl.deleteProgram(program);
    throw new Error(error);
  }
  return program;
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader) || "Physical GPU shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(error);
  }
  return shader;
}
