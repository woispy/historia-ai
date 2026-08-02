import {
  useMemo,
} from "react";

import {
  createRenderQueue,
} from "../services";

/**
 * ============================================================================
 * Historia AI
 * Rendering Hook
 * ============================================================================
 */

export function useRendering(
  rendering
) {
  return useMemo(() => {
    if (!rendering) {
      return {
        queue: [],
      };
    }

    return {
      queue:
        createRenderQueue(
          rendering.layers
        ),
    };
  }, [rendering]);
}