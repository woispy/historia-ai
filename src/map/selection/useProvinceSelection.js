import { useEffect, useState } from "react";

import {
  getProvinceSelection,
  subscribeProvinceSelection,
} from "./ProvinceSelection";

export function useProvinceSelection() {
  const [selection, setSelection] = useState(
    getProvinceSelection()
  );

  useEffect(() => {
    return subscribeProvinceSelection(
      setSelection
    );
  }, []);

  return selection;
}