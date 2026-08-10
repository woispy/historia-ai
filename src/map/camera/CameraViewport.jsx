import { useEffect, useRef } from "react";

const NON_PASSIVE_WHEEL_OPTIONS = Object.freeze({ passive: false });

function CameraViewport({ children, cameraInput = null }) {
  const viewportRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const wheelHandler = cameraInput?.onWheel;

    if (!viewport || !wheelHandler) return undefined;

    // Wheel is intentionally non-passive because the map owns the wheel and
    // must suppress page scrolling while zooming. The handler itself does not
    // call preventDefault(); the native listener is the only place where the
    // browser cancellation contract is controlled.
    viewport.addEventListener(
      "wheel",
      wheelHandler,
      NON_PASSIVE_WHEEL_OPTIONS,
    );

    return () => {
      viewport.removeEventListener(
        "wheel",
        wheelHandler,
        NON_PASSIVE_WHEEL_OPTIONS,
      );
    };
  }, [cameraInput?.onWheel]);

  useEffect(
    () => () => cameraInput?.dispose?.(),
    [cameraInput],
  );

  return (
    <div
      ref={viewportRef}
      className="camera-viewport"
      onWheel={(event) => {
        // Keep React from installing a competing wheel handler. Zoom is handled
        // by the native listener above, which is explicitly non-passive.
        if (event.cancelable) event.preventDefault();
      }}
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
        overscrollBehavior: "none",
        cursor: "grab",
      }}
    >
      {children}
    </div>
  );
}

export default CameraViewport;
