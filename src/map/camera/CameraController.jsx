import { useEffect, useRef } from "react";

/**
 * ============================================================================
 * Historia AI
 * Camera Controller
 * ============================================================================
 */

function CameraController({ zoom, move, smooth = true }) {
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pending = useRef({ x: 0, y: 0 });
  const frame = useRef(0);

  useEffect(() => {
    function flushMove() {
      frame.current = 0;
      const { x, y } = pending.current;
      pending.current = { x: 0, y: 0 };
      if (x || y) move(x, y);
    }

    function queueMove(dx, dy) {
      if (!smooth) {
        move(dx, dy);
        return;
      }

      pending.current.x += dx;
      pending.current.y += dy;
      if (!frame.current) frame.current = requestAnimationFrame(flushMove);
    }

    function handleWheel(event) {
      if (event.target.closest?.("button, input, select, textarea")) return;
      event.preventDefault();
      zoom(event.deltaY < 0 ? 0.2 : -0.2);
    }

    function handleMouseDown(event) {
      if (event.button !== 0) return;
      if (event.target.closest?.("button, input, select, textarea")) return;
      dragging.current = true;
      last.current = { x: event.clientX, y: event.clientY };
    }

    function handleMouseMove(event) {
      if (!dragging.current) return;
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      queueMove(dx, dy);
      last.current = { x: event.clientX, y: event.clientY };
    }

    function handleMouseUp() {
      dragging.current = false;
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      pending.current = { x: 0, y: 0 };
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [zoom, move, smooth]);

  return null;
}

export default CameraController;
