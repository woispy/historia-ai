import { useEffect, useRef } from "react";

/**
 * ============================================================================
 * Historia AI
 * Camera Controller
 * ============================================================================
 */

function CameraController({
  zoom,
  move,
}) {
  const dragging =
    useRef(false);

  const last =
    useRef({
      x: 0,
      y: 0,
    });

  useEffect(() => {
    function handleWheel(event) {
      event.preventDefault();

      zoom(
        event.deltaY < 0
          ? 0.2
          : -0.2
      );
    }

    function handleMouseDown(
      event
    ) {
      if (event.button !== 0) {
        return;
      }

      dragging.current = true;

      last.current = {
        x: event.clientX,
        y: event.clientY,
      };
    }

    function handleMouseMove(
      event
    ) {
      if (
        !dragging.current
      ) {
        return;
      }

      const dx =
        event.clientX -
        last.current.x;

      const dy =
        event.clientY -
        last.current.y;

      move(dx, dy);

      last.current = {
        x: event.clientX,
        y: event.clientY,
      };
    }

    function handleMouseUp() {
      dragging.current =
        false;
    }

    window.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: false,
      }
    );

    window.addEventListener(
      "mousedown",
      handleMouseDown
    );

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "mouseup",
      handleMouseUp
    );

    return () => {
      window.removeEventListener(
        "wheel",
        handleWheel
      );

      window.removeEventListener(
        "mousedown",
        handleMouseDown
      );

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "mouseup",
        handleMouseUp
      );
    };
  }, [zoom, move]);

  return null;
}

export default CameraController;