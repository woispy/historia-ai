import { useState } from "react";
import { bootstrapCamera } from "../CameraBootstrap";
import { moveCamera, zoomCamera, setCameraZoom, setCameraPosition, resetCamera, focusCamera } from "../CameraActions";
import { useViewport } from "../viewport";

export function useCamera() {
  const viewport = useViewport();
  const [camera, setCamera] = useState(() => bootstrapCamera());

  function move(dx, dy) {
    setCamera((previous) => moveCamera(previous, dx, dy, viewport));
  }

  function zoom(delta) {
    setCamera((previous) => zoomCamera(previous, delta, viewport));
  }

  function setPosition(x, y) {
    setCamera((previous) => setCameraPosition(previous, x, y, viewport));
  }

  function setZoom(zoomValue) {
    setCamera((previous) => setCameraZoom(previous, zoomValue, viewport));
  }

  function reset() {
    setCamera(resetCamera());
  }

  function focus(x, y, target) {
    setCamera((previous) => focusCamera(previous, x, y, target, viewport));
  }

  return { camera, move, zoom, focus, setZoom, setPosition, reset };
}
