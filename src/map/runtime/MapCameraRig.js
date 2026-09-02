/**
 * Frame-driven 2.5D camera rig.
 *
 * React receives coarse camera snapshots; animation, inertia and angle clamps
 * remain in the renderer domain so pointer motion never forces a UI render.
 */

const WORLD = Object.freeze({ minX: -180, maxX: 180, minY: -90, maxY: 90 });

export class MapCameraRig {
  constructor(options = {}) {
    this.state = {
      x: 0,
      y: 0,
      zoom: 1,
      pitch: Number.isFinite(Number(options.pitch)) ? Number(options.pitch) : 24,
      yaw: Number.isFinite(Number(options.yaw)) ? Number(options.yaw) : 0,
    };
    this.velocity = { x: 0, y: 0, zoom: 0, pitch: 0, yaw: 0 };
    this.minZoom = options.minZoom ?? 1;
    this.maxZoom = options.maxZoom ?? 96;
    this.pitchMin = options.pitchMin ?? 10;
    this.pitchMax = options.pitchMax ?? 42;
    this.yawMin = options.yawMin ?? -12;
    this.yawMax = options.yawMax ?? 12;
    this.state.pitch = clamp(this.state.pitch, this.pitchMin, this.pitchMax);
    this.state.yaw = clamp(this.state.yaw, this.yawMin, this.yawMax);
  }

  setState(next = {}) {
    this.state.x = Number.isFinite(Number(next.x)) ? Number(next.x) : this.state.x;
    this.state.y = Number.isFinite(Number(next.y)) ? Number(next.y) : this.state.y;
    this.state.zoom = clamp(Number(next.zoom) || this.state.zoom, this.minZoom, this.maxZoom);
    if (Number.isFinite(Number(next.pitch))) this.state.pitch = clamp(Number(next.pitch), this.pitchMin, this.pitchMax);
    if (Number.isFinite(Number(next.yaw))) this.state.yaw = clamp(Number(next.yaw), this.yawMin, this.yawMax);
  }

  beginDrag() {
    this.velocity.x = 0;
    this.velocity.y = 0;
  }

  panPixels(dx, dy, viewportWidth = 1, viewportHeight = 1) {
    const zoom = Math.max(0.001, this.state.zoom);
    const scaleX = 360 / (Math.max(1, viewportWidth) * zoom);
    const scaleY = 180 / (Math.max(1, viewportHeight) * zoom);
    this.velocity.x = -dx * scaleX;
    this.velocity.y = dy * scaleY;
    this.state.x = clamp(this.state.x + this.velocity.x, WORLD.minX + 1, WORLD.maxX - 1);
    this.state.y = clamp(this.state.y + this.velocity.y, WORLD.minY + 1, WORLD.maxY - 1);
  }

  zoomBy(delta) {
    this.state.zoom = clamp(this.state.zoom * Math.exp(Number(delta) || 0), this.minZoom, this.maxZoom);
  }

  rotateBy(deltaYaw, deltaPitch) {
    this.state.yaw = clamp(this.state.yaw + (Number(deltaYaw) || 0), this.yawMin, this.yawMax);
    this.state.pitch = clamp(this.state.pitch + (Number(deltaPitch) || 0), this.pitchMin, this.pitchMax);
  }

  tick(dtSeconds) {
    const dt = Math.min(0.05, Math.max(0, Number(dtSeconds) || 0));
    const damping = Math.exp(-8 * dt);
    if (Math.abs(this.velocity.x) > 0.00001 || Math.abs(this.velocity.y) > 0.00001) {
      this.state.x = clamp(this.state.x + this.velocity.x * dt * 60, WORLD.minX + 1, WORLD.maxX - 1);
      this.state.y = clamp(this.state.y + this.velocity.y * dt * 60, WORLD.minY + 1, WORLD.maxY - 1);
    }
    this.velocity.x *= damping;
    this.velocity.y *= damping;
    return this.snapshot();
  }

  snapshot() {
    return { ...this.state };
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default MapCameraRig;
