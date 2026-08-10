import { useCallback, useMemo, useRef } from "react";
import { getWheelZoomDelta } from "./CameraZoom";

/**
 * Map-local pointer input.
 *
 * Wheel input is attached by CameraViewport as a native non-passive listener.
 * That keeps preventDefault() legal and avoids Chromium's passive-listener
 * warning while preventing the page from scrolling during map zoom.
 */
export function useCameraController({ zoom, move, smooth = true }) {
  const dragging = useRef(false);
  const dragged = useRef(false);
  const pointerId = useRef(null);
  const last = useRef({ x: 0, y: 0 });
  const pending = useRef({ x: 0, y: 0 });
  const frame = useRef(0);

  const flushMove = useCallback(() => {
    frame.current = 0;
    const { x, y } = pending.current;
    pending.current = { x: 0, y: 0 };
    if (x || y) move(x, y);
  }, [move]);

  const queueMove = useCallback((dx, dy) => {
    if (!smooth) {
      move(dx, dy);
      return;
    }

    pending.current.x += dx;
    pending.current.y += dy;

    if (!frame.current) {
      frame.current = requestAnimationFrame(flushMove);
    }
  }, [flushMove, move, smooth]);

  const handleWheel = useCallback((event) => {
    if (event.cancelable) event.preventDefault();

    const delta = getWheelZoomDelta(event, zoom);
    if (delta) zoom(delta);
  }, [zoom]);

  const handlePointerDown = useCallback((event) => {
    if (event.button !== 0) return;

    dragging.current = true;
    dragged.current = false;
    pointerId.current = event.pointerId;
    last.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event) => {
    if (!dragging.current || event.pointerId !== pointerId.current) return;

    const dx = event.clientX - last.current.x;
    const dy = event.clientY - last.current.y;

    if (Math.abs(dx) + Math.abs(dy) > 2) dragged.current = true;

    queueMove(dx, dy);
    last.current = { x: event.clientX, y: event.clientY };
  }, [queueMove]);

  const stopDragging = useCallback((event) => {
    if (pointerId.current !== null) {
      event.currentTarget.releasePointerCapture?.(pointerId.current);
    }

    dragging.current = false;
    pointerId.current = null;
  }, []);

  const handlePointerCancel = useCallback((event) => {
    pending.current = { x: 0, y: 0 };
    stopDragging(event);
  }, [stopDragging]);

  const handleClickCapture = useCallback((event) => {
    if (!dragged.current) return;
    event.preventDefault();
    event.stopPropagation();
    dragged.current = false;
  }, []);

  const dispose = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    pending.current = { x: 0, y: 0 };
    dragging.current = false;
    pointerId.current = null;
  }, []);

  return useMemo(() => ({
    onWheel: handleWheel,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: stopDragging,
    onPointerCancel: handlePointerCancel,
    onClickCapture: handleClickCapture,
    dispose,
  }), [
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    stopDragging,
    handlePointerCancel,
    handleClickCapture,
    dispose,
  ]);
}
