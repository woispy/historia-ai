import { useCallback, useMemo, useRef } from "react";
import { getWheelZoomDelta } from "./CameraZoom";

/**
 * Map-local pointer input.
 *
 * Pointer and wheel input are coalesced to one state update per animation
 * frame. This keeps React rendering out of the browser's high-frequency input
 * path and makes close-range zooming feel as responsive as world view.
 */
export function useCameraController({ zoom, move, smooth = true }) {
  const dragging = useRef(false);
  const dragged = useRef(false);
  const pointerId = useRef(null);
  const last = useRef({ x: 0, y: 0 });
  const pending = useRef({ x: 0, y: 0, zoom: 0 });
  const frame = useRef(0);

  const flushFrame = useCallback(() => {
    frame.current = 0;
    const pending = pending.current;
    pending.current = { x: 0, y: 0, zoom: 0 };

    if (pending.x || pending.y) move(pending.x, pending.y);
    if (pending.zoom) zoom(pending.zoom);
  }, [move, zoom]);

  const scheduleFrame = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(flushFrame);
  }, [flushFrame]);

  const queueMove = useCallback((dx, dy) => {
    if (!smooth) {
      move(dx, dy);
      return;
    }

    pending.current.x += dx;
    pending.current.y += dy;
    scheduleFrame();
  }, [move, scheduleFrame, smooth]);

  const handleWheel = useCallback((event) => {
    if (event.cancelable) event.preventDefault();

    const delta = getWheelZoomDelta(event, zoom);
    if (!delta) return;

    if (!smooth) {
      zoom(delta);
      return;
    }

    pending.current.zoom += delta;
    scheduleFrame();
  }, [scheduleFrame, smooth, zoom]);

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
    pending.current = { x: 0, y: 0, zoom: 0 };
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
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
    pending.current = { x: 0, y: 0, zoom: 0 };
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
