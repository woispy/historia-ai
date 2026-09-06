import assert from "node:assert/strict";
import { MapRuntimeController } from "../../src/map/runtime/MapRuntimeController.js";
import { MapRendererContract, assertRendererContract } from "../../src/map/rendering/MapRendererContract.js";

class MockCanvas {
  constructor() { this.clientWidth = 1280; this.clientHeight = 720; this.listeners = new Map(); }
  addEventListener(type, handler) { this.listeners.set(type, handler); }
  removeEventListener(type) { this.listeners.delete(type); }
  setPointerCapture() {}
  releasePointerCapture() {}
  getBoundingClientRect() { return { left: 0, top: 0, right: this.clientWidth, bottom: this.clientHeight, width: this.clientWidth, height: this.clientHeight }; }
}

class MockCameraRig {
  constructor() { this.state = { x: 0, renderX: 0, y: 0, zoom: 1, pitch: 24, yaw: 0 }; this.ticks=[]; }
  setState(next = {}) { this.state = { ...this.state, ...next }; }
  snapshot() { return { ...this.state }; }
  beginDrag() {}
  panPixels() {}
  zoomBy() {}
  tick(dt) { this.ticks.push(dt); this.state.renderX += 10 * dt; this.state.x = this.state.renderX >= 180 ? this.state.renderX - 360 : this.state.renderX; return this.snapshot(); }
}

class MockRenderer extends MapRendererContract {
  constructor() { super(); this.picks=[]; this.hovered=[]; this.cameras=[]; this.selected=[]; this.starts=0; this.stops=0; this.disposals=0; this.resizes=0; }
  initialize() { return true; }
  resize() { this.resizes += 1; }
  setCamera(camera) { this.cameras.push(camera); }
  setSelectedProvinceId(id) { this.selected.push(id); }
  setHoveredProvinceId(id) { this.hovered.push(id); }
  pick(x,y) { this.picks.push([x,y]); return "province-7"; }
  render() {}
  start() { this.starts += 1; }
  stop() { this.stops += 1; }
  dispose() { this.disposals += 1; }
}

const originalRaf = globalThis.requestAnimationFrame;
const originalCancelRaf = globalThis.cancelAnimationFrame;
let rafCallbacks = new Map();
let rafId = 0;
globalThis.requestAnimationFrame = (callback) => { const id=++rafId; rafCallbacks.set(id,callback); return id; };
globalThis.cancelAnimationFrame = (id) => rafCallbacks.delete(id);
const flushRaf = (timestamp = 0) => { const callbacks=[...rafCallbacks.values()]; rafCallbacks.clear(); callbacks.forEach((callback)=>callback(timestamp)); };

try {
  const canvas=new MockCanvas(), renderer=new MockRenderer(), rig=new MockCameraRig();
  const controller=new MapRuntimeController({ canvas, cameraRig:rig, renderer });

  assert.doesNotThrow(() => assertRendererContract(renderer));
  assert.equal(controller.running,false);
  controller.start();
  assert.equal(controller.running,true);
  assert.equal(renderer.starts,1);
  assert.equal(renderer.resizes,1);

  flushRaf(1000);
  assert.equal(rig.ticks.length,1);
  assert.equal(rig.ticks[0],0);
  assert.equal(renderer.cameras.at(-1).renderX,0);

  flushRaf(1016.6666667);
  assert.equal(rig.ticks.length,2);
  assert.ok(Math.abs(rig.ticks[1] - 1 / 60) < 1e-6);
  assert.ok(renderer.cameras.at(-1).renderX > 0);

  controller.queueHover(10,20);
  controller.queueHover(30,40);
  controller.queueHover(50,60);
  assert.equal(renderer.picks.length,0);
  flushRaf(1033.3333334);
  assert.deepEqual(renderer.picks,[[50,60]]);
  assert.deepEqual(renderer.hovered,["province-7"]);

  controller.queueHover(70,80);
  controller.queueHover(90,100);
  flushRaf(1050);
  assert.deepEqual(renderer.picks,[[50,60],[90,100]]);

  controller.setExternalCamera({ zoom:4 });
  assert.equal(renderer.cameras.at(-1).zoom,4);
  controller.setSelectedProvinceId("province-7");
  controller.setOnProvinceClick(() => {});
  controller.stop();
  assert.equal(renderer.stops,1);
  assert.equal(controller.frameRequest,0);
  controller.dispose();
  assert.equal(renderer.disposals,1);
  assert.equal(controller.destroyed,true);
} finally {
  globalThis.requestAnimationFrame=originalRaf;
  globalThis.cancelAnimationFrame=originalCancelRaf;
}

console.log("Map runtime controller passed: imperative lifecycle, frame-driven camera ticking, one hover pick per RAF frame, latest-sample wins, and explicit disposal.");
