import { useMemo } from "react";

import {
  getProvinces,
} from "../../provinces";

export function useWorldMap(runtime) {
  return useMemo(() => {
    if (!runtime) {
      return {
        provinces: [],
      };
    }

    const repository =
      runtime.world.repositories.provinces;

    return {
      provinces:
        getProvinces(repository),
    };
  }, [runtime]);
}