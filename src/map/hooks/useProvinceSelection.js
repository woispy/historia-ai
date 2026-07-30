import { useState } from "react";

export function useProvinceSelection() {
  const [selectedProvince, setSelectedProvince] =
    useState(null);

  function selectProvince(provinceId) {
    setSelectedProvince(provinceId);
  }

  function clearSelection() {
    setSelectedProvince(null);
  }

  return {
    selectedProvince,
    selectProvince,
    clearSelection,
  };
}