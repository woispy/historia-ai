import {
  getProvinceNeighbours,
} from "../../provinces";

/**
 * ============================================================================
 * Historia AI
 * Path Finder
 * ============================================================================
 *
 * Breadth First Search implementation.
 *
 * Returns the shortest province path.
 */

export function findPath(
  runtime,
  startProvinceId,
  targetProvinceId
) {
  if (startProvinceId === targetProvinceId) {
    return [startProvinceId];
  }

  const queue = [[startProvinceId]];

  const visited = new Set([
    startProvinceId,
  ]);

  while (queue.length > 0) {
    const currentPath =
      queue.shift();

    const currentProvince =
      currentPath[
        currentPath.length - 1
      ];

    const neighbours =
      getProvinceNeighbours(
        runtime,
        currentProvince
      );

    for (const neighbour of neighbours) {
      if (visited.has(neighbour)) {
        continue;
      }

      const nextPath = [
        ...currentPath,
        neighbour,
      ];

      if (
        neighbour === targetProvinceId
      ) {
        return nextPath;
      }

      visited.add(neighbour);

      queue.push(nextPath);
    }
  }

  return [];
}