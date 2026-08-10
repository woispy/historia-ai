import { CameraContext } from "./CameraContext";

function CameraProvider({ value, children }) {
  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
}

export default CameraProvider;
