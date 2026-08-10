import { createCameraModel } from "./CameraModel";

const WORLD_WIDTH = 360;
const WORLD_HEIGHT = 180;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getWorldDegreesPerPixel(viewport, zoom) {
  const width = Math.max(1, Number(viewport?.width ?? 1));
  const height = Math.max(1, Number(viewport?.height ?? 1));
  return {
    x: WORLD_WIDTH / (width * Math.max(zoom, 0.001)),
    y: WORLD_HEIGHT / (height * Math.max(zoom, 0.001)),
  };
}

function constrainPosition(camera, x, y, viewport) {
  if (!viewport?.width || !viewport?.height) return { x, y };

  const degrees = getWorldDegreesPerPixel(viewport, camera.zoom);
  const visibleHeight = viewport.height * degrees.y;
  const verticalRange = Math.max(0, (WORLD_HEIGHT - visibleHeight) / 2);

  return {
    x,
    y: clamp(y, -verticalRange, verticalRange),
  };
}

export function moveCamera(camera, dx, dy, viewport) {
  const degrees = getWorldDegreesPerPixel(viewport, camera.zoom);
  return {
    ...camera,
    ...constrainPosition(
      camera,
      camera.x + dx * degrees.x,
      camera.y - dy * degrees.y,
      viewport,
    ),
  };
}

export function zoomCamera(camera, delta, viewport) {
  const zoom = clamp(camera.zoom + delta, camera.minZoom, camera.maxZoom);
  const nextCamera = { ...camera, zoom };
  return {
    ...nextCamera,
    ...constrainPosition(nextCamera, nextCamera.x, nextCamera.y, viewport),
  };
}

export function setCameraZoom(camera, zoom, viewport) {
  const nextCamera = {
    ...camera,
    zoom: clamp(zoom, camera.minZoom, camera.maxZoom),
  };
  return {
    ...nextCamera,
    ...constrainPosition(nextCamera, nextCamera.x, nextCamera.y, viewport),
  };
}

export function setCameraPosition(camera, x, y, viewport) {
  return {
    ...camera,
    ...constrainPosition(camera, x, y, viewport),
  };
}

export function focusCamera(camera, x, y, target = null, viewport) {
  return {
    ...camera,
    ...constrainPosition(camera, x, y, viewport),
    target,
  };
}

export function resetCamera() {
  return createCameraModel();
}
