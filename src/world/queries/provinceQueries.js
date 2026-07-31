import { getWorld } from "../../state";

export function getProvince(runtime, provinceId) {
  const world = getWorld(runtime);

  return world.map.provinces.byId[provinceId] ?? null;
}

export function getProvinces(runtime) {
  const world = getWorld(runtime);

  return world.map.provinces.allIds.map(
    (id) => world.map.provinces.byId[id]
  );
}

export function getProvinceNeighbours(runtime, provinceId) {
  const world = getWorld(runtime);

  return (
    world.map.topology.adjacency[provinceId] ?? []
  );
}

export function getProvinceOwner(runtime, provinceId) {
  return getProvince(runtime, provinceId)?.owner ?? null;
}

export function getProvinceController(runtime, provinceId) {
  return getProvince(runtime, provinceId)?.controller ?? null;
}