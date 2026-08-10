import { createContext, useContext } from "react";

export const CameraContext = createContext(null);

export function useCameraContext() {
  const context = useContext(CameraContext);

  if (!context) {
    throw new Error("useCameraContext must be used inside CameraProvider.");
  }

  return context;
}
