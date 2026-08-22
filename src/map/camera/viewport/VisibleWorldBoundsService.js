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

  const corners = [
    screenToWorld(0, 0, camera),
    screenToWorld(width, 0, camera),
    screenToWorld(0, height, camera),
    screenToWorld(width, height, camera),
  ];

  return {
    minX: Math.min(...corners.map(({ x }) => x)),
    minY: Math.min(...corners.map(({ y }) => y)),
    maxX: Math.max(...corners.map(({ x }) => x)),
    maxY: Math.max(...corners.map(({ y }) => y)),
  };
}
