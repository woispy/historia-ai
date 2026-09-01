import { assertRendererContract } from "../rendering/MapRendererContract.js";

const DEFAULT_HOVER_EPSILON_PX = 0;

/** Imperative owner of map interaction and renderer lifecycle. */
export class MapRuntimeController {
  constructor({ canvas, cameraRig, renderer, onProvinceClick, hoverEpsilonPx = DEFAULT_HOVER_EPSILON_PX }) {
    if (!canvas) throw new TypeError("MapRuntimeController requires a canvas");
    if (!cameraRig) throw new TypeError("MapRuntimeController requires a cameraRig");
    this.canvas = canvas;
    this.cameraRig = cameraRig;
    this.renderer = assertRendererContract(renderer);
    this.onProvinceClick = onProvinceClick;
    this.hoverEpsilonPx = Math.max(0, Number(hoverEpsilonPx) || 0);
    this.destroyed = false;
    this.running = false;
    this.pendingHover = false;
    this.hoverX = 0;
    this.hoverY = 0;
    this.lastQueuedHoverX = Number.NaN;
    this.lastQueuedHoverY = Number.NaN;
    this.hoverFrameRequest = 0;
    this.resizeObserver = null;
    this.drag = { active: false, pointerId: null, moved: false, lastX: 0, lastY: 0 };

    this.handleWheel = this.handleWheel.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerCancel = this.handlePointerCancel.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  start() {
    if (this.destroyed || this.running) return;
    this.running = true;
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);
    this.canvas.addEventListener("pointercancel", this.handlePointerCancel);
    this.canvas.addEventListener("click", this.handleClick);
    this.resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(this.handleResize) : null;
    this.resizeObserver?.observe(this.canvas);
    this.handleResize();
    this.renderer.start();
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    this.cancelPendingHover();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("pointercancel", this.handlePointerCancel);
    this.canvas.removeEventListener("click", this.handleClick);
    this.renderer.stop();
  }

  setExternalCamera(camera) {
    if (this.destroyed) return;
    this.cameraRig.setState(camera);
    this.renderer.setCamera(this.cameraRig.snapshot());
  }

  setSelectedProvinceId(provinceId) {
    if (!this.destroyed) this.renderer.setSelectedProvinceId(provinceId);
  }

  setOnProvinceClick(callback) {
    if (!this.destroyed) this.onProvinceClick = callback;
  }

  queueHover(clientX, clientY) {
    if (this.destroyed || !this.running || this.drag.active) return;
    const x = Number(clientX), y = Number(clientY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (Number.isFinite(this.lastQueuedHoverX) && Math.abs(this.lastQueuedHoverX - x) <= this.hoverEpsilonPx && Math.abs(this.lastQueuedHoverY - y) <= this.hoverEpsilonPx) return;
    this.hoverX = x;
    this.hoverY = y;
    this.lastQueuedHoverX = x;
    this.lastQueuedHoverY = y;
    this.pendingHover = true;
    if (this.hoverFrameRequest) return;
    this.hoverFrameRequest = requestAnimationFrame(() => {
      this.hoverFrameRequest = 0;
      if (this.destroyed || !this.running || !this.pendingHover) return;
      const xSample = this.hoverX, ySample = this.hoverY;
      this.pendingHover = false;
      this.renderer.setHoveredProvinceId(this.renderer.pick(xSample, ySample));
    });
  }

  cancelPendingHover() {
    if (this.hoverFrameRequest) cancelAnimationFrame(this.hoverFrameRequest);
    this.hoverFrameRequest = 0;
    this.pendingHover = false;
  }

  handleWheel(event) {
    if (this.destroyed) return;
    event.preventDefault();
    this.cameraRig.zoomBy(-event.deltaY * 0.0015);
    this.renderer.setCamera(this.cameraRig.snapshot());
  }

  handlePointerDown(event) {
    if (this.destroyed || event.button !== 0) return;
    this.cancelPendingHover();
    this.drag.active = true;
    this.drag.pointerId = event.pointerId;
    this.drag.moved = false;
    this.drag.lastX = event.clientX;
    this.drag.lastY = event.clientY;
    this.cameraRig.beginDrag();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  handlePointerMove(event) {
    if (this.destroyed) return;
    if (this.drag.active && this.drag.pointerId === event.pointerId) {
      const dx = event.clientX - this.drag.lastX, dy = event.clientY - this.drag.lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.drag.moved = true;
      this.drag.lastX = event.clientX;
      this.drag.lastY = event.clientY;
      this.cameraRig.panPixels(dx, dy, this.canvas.clientWidth, this.canvas.clientHeight);
      this.renderer.setCamera(this.cameraRig.snapshot());
      return;
    }
    this.queueHover(event.clientX, event.clientY);
  }

  handlePointerUp(event) {
    if (!this.drag.active || this.drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    this.drag.active = false;
    this.drag.pointerId = null;
  }

  handlePointerCancel(event) {
    if (!this.drag.active || this.drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    this.drag.active = false;
    this.drag.pointerId = null;
    this.drag.moved = false;
  }

  handleClick(event) {
    if (this.destroyed) return;
    if (this.drag.moved) {
      this.drag.moved = false;
      return;
    }
    const provinceId = this.renderer.pick(event.clientX, event.clientY);
    if (provinceId) this.onProvinceClick?.(provinceId);
  }

  handleResize() {
    if (!this.destroyed) this.renderer.resize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  dispose() {
    if (this.destroyed) return;
    this.stop();
    this.destroyed = true;
    this.pendingHover = false;
    this.cameraRig = null;
    this.onProvinceClick = null;
    this.renderer.dispose();
    this.renderer = null;
  }
}

export default MapRuntimeController;
