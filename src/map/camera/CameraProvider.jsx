import {
  createContext,
  useContext,
} from "react";

/**
 * ============================================================================
 * Historia AI
 * Camera Provider
 * ============================================================================
 */

const CameraContext =
  createContext(null);

function CameraProvider({
  value,
  children,
}) {
  return (
    <CameraContext.Provider
      value={value}
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