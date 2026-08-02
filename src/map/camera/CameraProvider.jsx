import {
  createContext,
  useContext,
} from "react";

import {
  useCamera,
} from "./useCamera";

/**
 * ============================================================================
 * Historia AI
 * Camera Provider
 * ============================================================================
 */

const CameraContext =
  createContext(null);

function CameraProvider({
  children,
}) {
  const camera =
    useCamera();

  return (
    <CameraContext.Provider
      value={camera}
    >
      {children}
    </CameraContext.Provider>
  );
}

export function useCameraContext() {
  const context =
    useContext(
      CameraContext
    );

  if (!context) {
    throw new Error(
      "useCameraContext must be used inside CameraProvider."
    );
  }

  return context;
}

export default CameraProvider;