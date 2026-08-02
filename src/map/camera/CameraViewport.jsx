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
  return (
    <div
      style={{
        width: "100%",
        height: "100%",

        transform: `
          translate(${camera.x}px, ${camera.y}px)
          scale(${camera.zoom})
        `,

        transformOrigin: "center center",

        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

export default CameraViewport;