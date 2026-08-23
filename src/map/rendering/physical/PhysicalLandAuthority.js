/**
 * Historia AI — physical land authority.
 *
 * Land is the primary physical topology. Sea/gulf presentation geometry may be
 * intentionally coarse, so it must never override an authoritative land hit.
 * Lakes are the exception because they are interior water bodies and therefore
 * explicitly subtract from usable land.
 */

import {
  isPointInLakeInterior,
  pointInAnyPolygon,
} from "./PhysicalGeometryValidation.js";

export function isPhysicalLandPoint(point, landPolygons = [], lakes = []) {
  return pointInAnyPolygon(point, landPolygons)
    && !isPointInLakeInterior(point, lakes);
}

export function isPhysicalSeaPoint(point, seaPolygons = [], landPolygons = []) {
  return pointInAnyPolygon(point, seaPolygons)
    && !pointInAnyPolygon(point, landPolygons);
}

export function isPhysicalChannelPoint(point, channelPolygons = []) {
  return pointInAnyPolygon(point, channelPolygons);
}

export function isUsablePhysicalLandPoint(
  point,
  landPolygons = [],
  seaPolygons = [],
  channelPolygons = [],
  lakes = [],
) {
  if (!isPhysicalLandPoint(point, landPolygons, lakes)) return false;
  if (isPhysicalSeaPoint(point, seaPolygons, landPolygons)) return false;
  if (isPhysicalChannelPoint(point, channelPolygons)) return false;
  return true;
}
