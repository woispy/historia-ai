import { useState } from "react";

import {
  bootstrapCamera,
} from "../CameraBootstrap";

import {
  moveCamera,
  zoomCamera,
  resetCamera,
  focusCamera,
} from "../CameraActions";

/**
 * ============================================================================
 * Historia AI
 * Camera Hook
 * ============================================================================
 */

export function useCamera() {
  const [camera, setCamera] =
    useState(() =>
      bootstrapCamera()
    );

  function move(dx, dy) {
    setCamera((previous) =>
      moveCamera(
        previous,
        dx,
        dy
      )
    );
  }

  function zoom(delta) {
    setCamera((previous) =>
      zoomCamera(
        previous,
        delta
      )
    );
  }

  function setPosition(x, y) {
    setCamera((previous) =>
      focusCamera(
        previous,
        x,
        y,
        previous.target
      )
    );
  }

  function setZoom(value) {
    setCamera((previous) => ({
      ...previous,

      zoom: Math.max(
        previous.minZoom,
        Math.min(
          previous.maxZoom,
          value
        ),
      ),
    }));
  }

  function reset() {
    setCamera(
      bootstrapCamera()
    );
  }

  function focus(x, y, target) {
    setCamera((previous) =>
      focusCamera(
        previous,
        x,
        y,
        target
      )
    );
  }

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