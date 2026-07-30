import { getProvinceNeighbours } from "../queries";

export function findPath(gameState, startProvinceId, targetProvinceId) {
  if (startProvinceId === targetProvinceId) {
    return [startProvinceId];
  }

  const queue = [[startProvinceId]];
  const visited = new Set([startProvinceId]);

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const currentProvince = currentPath[currentPath.length - 1];

    const neighbours = getProvinceNeighbours(
      gameState,
      currentProvince
    );

    for (const neighbour of neighbours) {
      if (visited.has(neighbour)) {
        continue;
      }

      const nextPath = [...currentPath, neighbour];

      if (neighbour === targetProvinceId) {
        return nextPath;
      }

      visited.add(neighbour);
      queue.push(nextPath);
    }
  }

  return [];
}