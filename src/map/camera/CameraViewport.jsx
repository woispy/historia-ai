import { useEffect, useRef } from "react";

function CameraViewport({ children, cameraInput = null }) {
  const viewportRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const wheelHandler = cameraInput?.onWheel;

    if (!viewport || !wheelHandler) return undefined;

    // React's wheel delegation may be treated as passive by the browser.
    // Register explicitly as non-passive so preventDefault() is guaranteed to
    // work and page scrolling cannot compete with map zooming.
    viewport.addEventListener("wheel", wheelHandler, { passive: false });

    return () => {
      viewport.removeEventListener("wheel", wheelHandler);
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
