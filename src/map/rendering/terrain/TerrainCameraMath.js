const DEFAULT_FOV_Y = 50 * Math.PI / 180;
const DEFAULT_NEAR = 0.25;
const DEFAULT_FAR = 1200;
const WORLD_CAMERA_DISTANCE = 430;

/** Build a column-major perspective MVP for the finite Historia world. */
export function buildTerrainMvp(camera = {}, width = 1, height = 1) {
  const zoom = Math.max(1, Number(camera.zoom) || 1);
  const aspect = Math.max(1e-6, Number(width) || 1) / Math.max(1, Number(height) || 1);
  const pitch = clamp(Number(camera.pitch) || 0, -89, 89) * Math.PI / 180;
  const yaw = Number(camera.yaw) || 0;
  const cx = Number(camera.x) || 0;
  const cy = Number(camera.y) || 0;
  const distance = WORLD_CAMERA_DISTANCE / zoom;
  const horizontalDistance = distance * Math.cos(pitch);
  const yawRadians = yaw * Math.PI / 180;
  const cameraPosition = [
    cx + Math.sin(yawRadians) * horizontalDistance,
    cy - Math.cos(yawRadians) * horizontalDistance,
    Math.max(0.5, distance * Math.sin(pitch)),
  ];
  const target = [cx, cy, 0];
  const view = lookAt(cameraPosition, target, [0, 0, 1]);
  const projection = perspective(DEFAULT_FOV_Y, aspect, DEFAULT_NEAR, DEFAULT_FAR);
  return multiply(projection, view);
}

export function cameraDistanceForZoom(zoom) {
  return WORLD_CAMERA_DISTANCE / Math.max(1, Number(zoom) || 1);
}

function perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY * 0.5);
  const range = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * range, -1,
    0, 0, near * far * 2 * range, 0,
  ]);
}

function lookAt(eye, target, up) {
  const forward = normalize([target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]]);
  const right = normalize(cross(forward, up));
  const trueUp = cross(right, forward);
  return new Float32Array([
    right[0], trueUp[0], -forward[0], 0,
    right[1], trueUp[1], -forward[1], 0,
    right[2], trueUp[2], -forward[2], 0,
    -dot(right, eye), -dot(trueUp, eye), dot(forward, eye), 1,
  ]);
}

function multiply(a, b) {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) for (let row = 0; row < 4; row += 1) {
    out[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
  }
  return out;
}

function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function normalize(v){const length=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/length,v[1]/length,v[2]/length];}
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
