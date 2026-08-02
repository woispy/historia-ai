import { useEffect } from "react";

import {
  getProvinceFocus,
} from "../services";

/**
 * ============================================================================
 * Historia AI
 * Camera Focus Hook
 * ============================================================================
 */

export function useCameraFocus({
  world,
  provinceId,
  focus,
}) {
  useEffect(() => {
    if (
      !world ||
      !provinceId
    ) {
      return;
    }

    const target =
      getProvinceFocus(
        world.map.geometry,
        provinceId
      );

    if (!target) {
      return;
    }

    focus(
      target.x,
      target.y,
      provinceId
    );
  }, [
    world,
    provinceId,
    focus,
  ]);
}