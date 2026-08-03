import {
  useViewport,
  createViewportTransform,
} from "./viewport";

/**
 * ============================================================================
 * Historia AI
 * Camera Viewport
 * ============================================================================
 */

function CameraViewport({
  camera,
  children,
}) {
  const viewport =
    useViewport();

  const transform =
    createViewportTransform(
      camera,
      viewport
    );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",

        overflow: "hidden",

        transform,

        transformOrigin:
          "center center",

        willChange:
          "transform",
      }}
    >
      {children}
    </div>
  );
}

export default CameraViewport;