import { useCallback, useState } from "react";
import { bootstrapCamera } from "../CameraBootstrap";
import {
  moveCamera,
  zoomCamera,
  setCameraZoom,
  setCameraPosition,
  resetCamera,
  focusCamera,
} from "../CameraActions";
import { useViewport } from "../viewport";

export function useCamera() {
  const viewport = useViewport();
  const [camera, setCamera] = useState(() => bootstrapCamera());

  const move = useCallback((dx, dy) => {
    setCamera((previous) => moveCamera(previous, dx, dy, viewport));
  }, [viewport]);

  const zoom = useCallback((delta) => {
    setCamera((previous) => zoomCamera(previous, delta, viewport));
  }, [viewport]);

  const setPosition = useCallback((x, y) => {
    setCamera((previous) => setCameraPosition(previous, x, y, viewport));
  }, [viewport]);

  const setZoom = useCallback((zoomValue) => {
    setCamera((previous) => setCameraZoom(previous, zoomValue, viewport));
  }, [viewport]);

  const reset = useCallback(() => {
    setCamera(resetCamera());
  }, []);

  const focus = useCallback((x, y, target) => {
    setCamera((previous) => focusCamera(previous, x, y, target, viewport));
  }, [viewport]);

  return {
    camera,
    move,
    zoom,
    focus,
    setZoom,
    setPosition,
    reset,
  };
}
