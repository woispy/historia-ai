import { useEffect, useRef } from "react";

const NON_PASSIVE_WHEEL_OPTIONS = Object.freeze({ passive: false });

function CameraViewport({ children, cameraInput = null, onViewportSizeChange = null }) {
  const viewportRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const wheelHandler = cameraInput?.onWheel;
    if (!viewport || !wheelHandler) return undefined;
    viewport.addEventListener("wheel", wheelHandler, NON_PASSIVE_WHEEL_OPTIONS);
    return () => viewport.removeEventListener("wheel", wheelHandler, NON_PASSIVE_WHEEL_OPTIONS);
  }, [cameraInput?.onWheel]);

  useEffect(() => () => cameraInput?.dispose?.(), [cameraInput]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined" || typeof onViewportSizeChange !== "function") return undefined;

    const report = (width, height) => onViewportSizeChange({
      width: Math.max(0, Math.round(width)),
      height: Math.max(0, Math.round(height)),
    });

    report(viewport.clientWidth, viewport.clientHeight);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) report(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [onViewportSizeChange]);

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
        backgroundColor: "#102c35",
      }}
    >
      {children}
    </div>
  );
}

export default CameraViewport;
