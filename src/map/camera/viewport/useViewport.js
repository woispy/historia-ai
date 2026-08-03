import {
  useEffect,
  useState,
} from "react";

import {
  createViewportModel,
} from "./ViewportModel";

import {
  resizeViewport,
} from "./ViewportActions";

/**
 * ============================================================================
 * Historia AI
 * Viewport Hook
 * ============================================================================
 */

export function useViewport() {
  const [viewport, setViewport] =
    useState(() =>
      createViewportModel()
    );

  useEffect(() => {
    function updateViewport() {
      setViewport((previous) =>
        resizeViewport(
          previous,
          window.innerWidth,
          window.innerHeight
        )
      );
    }

    updateViewport();

    window.addEventListener(
      "resize",
      updateViewport
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateViewport
      );
    };
  }, []);

  return viewport;
}