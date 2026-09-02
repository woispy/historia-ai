const DEFAULT_FOV_Y = 50 * Math.PI / 180;
const DEFAULT_NEAR = 0.25;
const DEFAULT_FAR = 1200;
const WORLD_CAMERA_DISTANCE = 430;

/** Build a column-major perspective MVP for the finite Historia world. */
export function buildTerrainMvp(camera = {}, width = 1, height = 1) {
  const zoom = Math.max(1, Number(camera.zoom) || 1);
  const aspect = Math.max(1e-6, Number(width) || 1) / Math.max(1, Number(height) || 1);
  const pitch = (Number(camera.pitch) || 0) * Math.PI / 180;
  const yaw = (Number(camera.yaw) || 0) * Math.PI / 180;
  const cx = Number(camera.x) || 0;
  const cy = Number(camera.y) || 0;
  const distance = WORLD_CAMERA_DISTANCE / zoom;
  const translation = translationMatrix(-cx, -cy, -distance);
  const yawMatrix = rotationZ(yaw);
  const pitchMatrix = rotationX(pitch);
  const view = multiply(pitchMatrix, multiply(yawMatrix, translation));
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

function translationMatrix(x, y, z) {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
}

function rotationX(angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
}

function rotationZ(angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
}

function multiply(a, b) {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) for (let row = 0; row < 4; row += 1) {
    out[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
  }
  return out;
}
