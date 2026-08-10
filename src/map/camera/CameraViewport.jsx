import { useEffect } from "react";

function CameraViewport({ children, cameraInput = null }) {
  useEffect(
    () => () => cameraInput?.dispose?.(),
    [cameraInput],
  );

  return (
    <div
      className="camera-viewport"
      onWheel={cameraInput?.onWheel}
      onPointerDown={cameraInput?.onPointerDown}
      onPointerMove={cameraInput?.onPointerMove}
      onPointerUp={cameraInput?.onPointerUp}
      onPointerCancel={cameraInput?.onPointerCancel}
      onClickCapture={cameraInput?.onClickCapture}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        touchAction: "none",
        cursor: "grab",
      }}
    >
      {children}
    </div>
  );
}

export default CameraViewport;
