export function expectedCopernicusGlo30TileIds(aoi) {
  if (!aoi || !Number.isInteger(aoi.west) || !Number.isInteger(aoi.east) || !Number.isInteger(aoi.south) || !Number.isInteger(aoi.north) || aoi.west >= aoi.east || aoi.south >= aoi.north || aoi.tileSizeDegrees !== 1) throw new Error("P6.2-A invalid GLO-30 AOI contract.");
  const id = (lat, lon) => `${lat >= 0 ? "N" : "S"}${String(Math.abs(lat)).padStart(2, "0")}_${lon >= 0 ? "E" : "W"}${String(Math.abs(lon)).padStart(3, "0")}`;
  const ids = [];
  for (let lat = aoi.south; lat < aoi.north; lat += 1) for (let lon = aoi.west; lon < aoi.east; lon += 1) ids.push(id(lat, lon));
  if (aoi.tileCount !== ids.length) throw new Error(`P6.2-A AOI tileCount mismatch: expected ${ids.length}, got ${aoi.tileCount}.`);
  return ids;
}

export function validateCopernicusGlo30TileSelection(selection, aoi) {
  const allowed = expectedCopernicusGlo30TileIds(aoi);
  const ids = Array.isArray(selection) ? selection : selection?.tileIds;
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("P6.2-A tile selection must be a non-empty array.");
  if (ids.some((id) => typeof id !== "string" || !/^[NS]\d{2}_[EW]\d{3}$/.test(id))) throw new Error("P6.2-A tile selection contains an invalid grid ID.");
  if (new Set(ids).size !== ids.length) throw new Error("P6.2-A tile selection contains duplicate grid IDs.");
  const outside = ids.filter((id) => !allowed.includes(id));
  if (outside.length) throw new Error(`P6.2-A tile selection contains IDs outside the pinned AOI: ${outside.join(", ")}.`);
  return [...ids];
}
