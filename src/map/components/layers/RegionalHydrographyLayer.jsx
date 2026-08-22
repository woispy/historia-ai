import { useEffect, useMemo, useState } from "react";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../data/AnatoliaPhysicalAtlas.js";
import { createHydrographyRegionLoader } from "../../physical/HydrographyRegionLoader.js";
import { selectHydrographyRegions } from "../../physical/HydrographyViewportSelector.js";
import { getViewportBounds } from "../../rendering/MapViewportCulling.js";
import { exactAreaPath, flattenCoordinatePoints, linearPathFromCoordinates, polygonPath } from "../../rendering/physical/PhysicalGeometryPath.js";
import { filterVisibleLakes, filterVisibleRivers } from "../../rendering/physical/PhysicalFeatureVisibility.js";
import { getPhysicalDetailProfile, getPhysicalPresentation, getPhysicalStrokeProfile } from "../../rendering/CartographyModel.js";

const LAND_CLIP_ID = "physical-anatolia-land-clip";
const loader = createHydrographyRegionLoader({ maxCachedRegions: 8 });

function boundsFromFeature(feature) {
  if (Array.isArray(feature?.bounds) && feature.bounds.length === 4) {
    return { minX: Number(feature.bounds[0]), minY: Number(feature.bounds[1]), maxX: Number(feature.bounds[2]), maxY: Number(feature.bounds[3]) };
  }
  const points = flattenCoordinatePoints(feature?.coordinates ?? feature?.rings ?? []);
  if (!points.length) return null;
  return points.reduce((bounds, [x, y]) => ({
    minX: Math.min(bounds.minX, x), minY: Math.min(bounds.minY, y),
    maxX: Math.max(bounds.maxX, x), maxY: Math.max(bounds.maxY, y),
  }), { minX: points[0][0], minY: points[0][1], maxX: points[0][0], maxY: points[0][1] });
}

function visible(feature, camera) {
  if (!camera) return true;
  const bounds = boundsFromFeature(feature);
  if (!bounds) return false;
  const viewport = getViewportBounds(camera, 0.12);
  return !(bounds.maxY < viewport.minY || bounds.minY > viewport.maxY || bounds.maxX < viewport.minX || bounds.minX > viewport.maxX);
}

function normalizeRegionFeature(feature, kind) {
  return kind === "lake"
    ? { ...feature, coordinates: feature.rings?.[0] ?? feature.coordinates ?? [], rings: feature.rings }
    : feature;
}

function mergeRegions(regions) {
  const lakes = new Map();
  const rivers = new Map();
  for (const region of regions) {
    for (const lake of region?.lakes ?? []) lakes.set(lake.id, normalizeRegionFeature(lake, "lake"));
    for (const river of region?.rivers ?? []) rivers.set(river.id, normalizeRegionFeature(river, "river"));
  }
  return { lakes: [...lakes.values()], rivers: [...rivers.values()] };
}

function River({ feature, width, underWidth, opacity }) {
  const d = linearPathFromCoordinates(feature.coordinates);
  if (!d) return null;
  return (
    <g pointerEvents="none">
      <path d={d} className="map-river-under" fill="none" strokeWidth={underWidth} opacity={opacity * 0.72} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d={d} className="map-river" fill="none" strokeWidth={width} opacity={opacity} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

function Lake({ feature, opacity }) {
  const d = exactAreaPath(feature.rings ?? [feature.coordinates]);
  return d ? <path d={d} className="map-lake" opacity={opacity} fillRule="evenodd" pointerEvents="none" /> : null;
}

function RegionalHydrographyLayer({ zoom, camera }) {
  const profile = getPhysicalDetailProfile(zoom);
  const [manifest, setManifest] = useState(null);
  const [regions, setRegions] = useState([]);
  const viewport = useMemo(() => getViewportBounds(camera, 0.2), [camera]);
  const selectorViewport = useMemo(() => ({
    minLon: viewport.minX, maxLon: viewport.maxX, minLat: viewport.minY, maxLat: viewport.maxY,
  }), [viewport]);
  const regionIds = useMemo(
    () => (manifest ? selectHydrographyRegions(manifest, selectorViewport, 8) : []),
    [manifest, selectorViewport],
  );

  useEffect(() => {
    let cancelled = false;
    loader.loadManifest()
      .then((value) => { if (!cancelled) setManifest(value); })
      .catch((error) => console.error("[RegionalHydrographyLayer] Failed to load manifest:", error));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!regionIds.length) return undefined;
    let cancelled = false;
    loader.loadRegions(regionIds)
      .then((values) => { if (!cancelled) setRegions(values); })
      .catch((error) => console.error("[RegionalHydrographyLayer] Failed to load regions:", error));
    return () => { cancelled = true; };
  }, [regionIds]);

  const activeRegions = regionIds.length ? regions : [];
  const hydrography = useMemo(() => mergeRegions(activeRegions), [activeRegions]);
  const presentation = getPhysicalPresentation(zoom);
  const stroke = getPhysicalStrokeProfile(zoom);
  const rivers = profile.rivers ? filterVisibleRivers(hydrography.rivers, zoom).filter((river) => visible(river, camera)) : [];
  const lakes = profile.lakes ? filterVisibleLakes(hydrography.lakes, zoom).filter((lake) => visible(lake, camera)) : [];
  const landPath = polygonPath(ANATOLIA_PHYSICAL_ATLAS.landPolygons);

  return (
    <>
      <defs>
        <clipPath id={LAND_CLIP_ID} clipPathUnits="userSpaceOnUse">
          <path d={landPath} fillRule="evenodd" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${LAND_CLIP_ID})`}>
        {rivers.map((river) => (
          <River key={river.id} feature={river} width={river.rank === 1 ? stroke.river : stroke.minorRiver} underWidth={river.rank === 1 ? stroke.river + 1.1 : stroke.minorRiver + 0.8} opacity={river.rank === 1 ? presentation.riverOpacity : presentation.riverOpacity * 0.72} />
        ))}
      </g>
      {lakes.map((lake) => <Lake key={lake.id} feature={lake} opacity={presentation.lakeOpacity} />)}
    </>
  );
}

export default RegionalHydrographyLayer;
