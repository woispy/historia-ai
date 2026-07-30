import { useMemo } from "react";

import { getProvinces } from "../../world";

export function useWorldMap(gameState) {
  return useMemo(() => {
    return {
      provinces: getProvinces(gameState),
    };
  }, [gameState]);
}