/**
 * Historia AI — physical land authority.
 *
 * Land is the primary physical topology for ownership and placement. Water is
 * a second, subtractive layer for usable-land queries: a coarse sea/gulf shape
 * may overlap a coarse land envelope, but that overlap must never become a
 * province or city placement surface.
 */

import {
  isPointInLakeInterior,
  pointInAnyPolygon,
} from "./PhysicalGeometryValidation.js";

export function isPhysicalLandPoint(point, landPolygons = [], lakes = []) {
  return pointInAnyPolygon(point, landPolygons)
    && !isPointInLakeInterior(point, lakes);
}

export function isPhysicalSeaPoint(point, seaPolygons = []) {
  return pointInAnyPolygon(point, seaPolygons);
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
  if (isPhysicalSeaPoint(point, seaPolygons)) return false;
  if (isPhysicalChannelPoint(point, channelPolygons)) return false;
  return true;
}
