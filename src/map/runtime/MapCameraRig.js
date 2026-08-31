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
      pitch: options.pitch ?? 24,
      yaw: options.yaw ?? 0,
    };
    this.velocity = { x: 0, y: 0, zoom: 0, pitch: 0, yaw: 0 };
    this.minZoom = options.minZoom ?? 1;
    this.maxZoom = options.maxZoom ?? 96;
    this.pitchMin = options.pitchMin ?? 10;
    this.pitchMax = options.pitchMax ?? 42;
    this.yawMin = options.yawMin ?? -12;
    this.yawMax = options.yawMax ?? 12;
  }

  beginDrag() {
    this.velocity.x = 0;
    this.velocity.y = 0;
  }

  panPixels(dx, dy, viewportWidth = 1, viewportHeight = 1) {
    const zoom = Math.max(0.001, this.state.zoom);
    const scaleX = 360 / (Math.max(1, viewportWidth) * zoom);
    const scaleY = 180 / (Math.max(1, viewportHeight) * zoom);
    const nextX = this.state.x - dx * scaleX;
    const nextY = this.state.y + dy * scaleY;
    this.velocity.x = -dx * scaleX;
    this.velocity.y = dy * scaleY;
    this.state.x = clamp(nextX, WORLD.minX + 1, WORLD.maxX - 1);
    this.state.y = clamp(nextY, WORLD.minY + 1, WORLD.maxY - 1);
  }

  zoomBy(delta) {
    const current = this.state.zoom;
    const next = clamp(current * Math.exp(delta), this.minZoom, this.maxZoom);
    this.velocity.zoom = next - current;
    this.state.zoom = next;
  }

  rotateBy(deltaYaw, deltaPitch) {
    this.state.yaw = clamp(this.state.yaw + deltaYaw, this.yawMin, this.yawMax);
    this.state.pitch = clamp(this.state.pitch + deltaPitch, this.pitchMin, this.pitchMax);
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
    this.velocity.zoom *= damping;
    return this.snapshot();
  }

  snapshot() {
    return {
      x: this.state.x,
      y: this.state.y,
      zoom: this.state.zoom,
      pitch: this.state.pitch,
      yaw: this.state.yaw,
    };
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default MapCameraRig;
