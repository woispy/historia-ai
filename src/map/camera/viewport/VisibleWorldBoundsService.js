import { screenToWorld } from './ViewportCoordinateService.js';

/**
 * Returns the axis-aligned world-space bounds currently visible through the
 * browser viewport. The same screen-to-world conversion used by rendering is
 * used for every corner, so streaming and rendering share one coordinate
 * contract.
 *
 * @param {{ x: number, y: number, zoom: number }} camera
 * @param {{ width: number, height: number }} viewport
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number }}
 */
export function getVisibleWorldBounds(camera, viewport) {
  if (!camera || !viewport) {
    throw new TypeError('camera and viewport are required');
  }

  const width = Number(viewport.width);
  const height = Number(viewport.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 0 || height < 0) {
    throw new RangeError('viewport width and height must be finite non-negative numbers');
  }
  if (!Number.isFinite(camera.x) || !Number.isFinite(camera.y) || !Number.isFinite(camera.zoom) || camera.zoom <= 0) {
    throw new RangeError('camera x, y and zoom must be finite; zoom must be positive');
  }

  const corners = [
    screenToWorld(0, 0, camera, viewport),
    screenToWorld(width, 0, camera, viewport),
    screenToWorld(0, height, camera, viewport),
    screenToWorld(width, height, camera, viewport),
  ];

  return {
    minX: Math.min(...corners.map(({ x }) => x)),
    minY: Math.min(...corners.map(({ y }) => y)),
    maxX: Math.max(...corners.map(({ x }) => x)),
    maxY: Math.max(...corners.map(({ y }) => y)),
  };
}
