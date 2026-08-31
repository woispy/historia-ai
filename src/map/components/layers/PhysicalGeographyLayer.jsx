import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../data/AnatoliaPhysicalAtlasRuntime.js";
import { getPhysicalDetailProfile, getPhysicalPresentation, getPhysicalStrokeProfile } from "../../rendering/CartographyModel.js";
import { getViewportBounds } from "../../rendering/MapViewportCulling.js";
import { exactAreaPath, flattenCoordinatePoints, polygonPath } from "../../rendering/physical/PhysicalGeometryPath.js";
import { filterVisibleLakes, filterVisibleRivers } from "../../rendering/physical/PhysicalFeatureVisibility.js";
import { layoutPhysicalLabels } from "../../rendering/physical/PhysicalLabelLayout.js";

const ANATOLIA_LAND_CLIP_ID = "physical-anatolia-land-clip";
const ANATOLIA_TERRAIN_LAND_CLIP_ID = "physical-anatolia-terrain-land-clip";

function linearPathFromCoordinates(coordinates) {
  const points = flattenCoordinatePoints(coordinates);
  if (points.length < 2) return "";
  return [`M ${points[0][0]} ${points[0][1]}`, ...points.slice(1).map(([x, y]) => `L ${x} ${y}`)].join(" ");
}

function getFeatureBounds(feature) {
  if (Array.isArray(feature?.bounds) && feature.bounds.length === 4) {
    return { minX: Number(feature.bounds[0]), minY: Number(feature.bounds[1]), maxX: Number(feature.bounds[2]), maxY: Number(feature.bounds[3]) };
  }
  const points = flattenCoordinatePoints(feature?.coordinates ?? feature?.rings ?? []);
  if (!points.length) return null;
  return points.reduce((bounds, [x, y]) => ({
    minX: Math.min(bounds.minX, x),
    minY: Math.min(bounds.minY, y),
    maxX: Math.max(bounds.maxX, x),
    maxY: Math.max(bounds.maxY, y),
  }), { minX: points[0][0], minY: points[0][1], maxX: points[0][0], maxY: points[0][1] });
}

function isFeatureVisible(feature, camera, padding = 0.12) {
  if (!camera) return true;
  const bounds = getFeatureBounds(feature);
  if (!bounds) return false;
  const viewport = getViewportBounds(camera, padding);
  if (bounds.maxY < viewport.minY || bounds.minY > viewport.maxY) return false;
  const normalize = (value) => {
    let result = Number(value);
    while (result > 180) result -= 360;
    while (result < -180) result += 360;
    return result;
  };
  const minX = normalize(bounds.minX);
  const maxX = normalize(bounds.maxX);
  if (bounds.minX >= -180 && bounds.maxX <= 180 && minX <= maxX) return !(maxX < viewport.minX || minX > viewport.maxX);
  return true;
}

function PhysicalPolygon({ feature, className = "", opacity = 1 }) {
  const d = exactAreaPath(feature.rings ?? [feature.coordinates]);
  if (!d) return null;
  return <path d={d} className={className} opacity={opacity} pointerEvents="none" fillRule="evenodd" />;
}

function PhysicalLine({ feature, className = "", underClassName = "", width = 1, underWidth = 0, opacity = 1 }) {
  const d = linearPathFromCoordinates(feature.coordinates);
  if (!d) return null;
  return (
    <g pointerEvents="none">
      {underWidth > 0 && (
        <path d={d} className={underClassName} fill="none" strokeWidth={underWidth} opacity={opacity * 0.72} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      )}
      <path d={d} className={className} fill="none" strokeWidth={width} opacity={opacity} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

function PhysicalLabel({ label }) {
  const rotation = Number(label.rotation ?? 0);
  return (
    <g transform={`translate(${label.x} ${label.y}) rotate(${rotation}) scale(1,-1)`} pointerEvents="none">
      <text
        textAnchor={label.align ?? "middle"}
        fontFamily="Georgia, serif"
        fontSize={label.fontSize ?? 0.24}
        fontWeight="700"
        letterSpacing={label.kind === "sea" ? "0.055" : "0.025"}
        fill={label.kind === "sea" ? "#a1b9bd" : "#77735f"}
        opacity={label.kind === "sea" ? 0.56 : 0.28}
        stroke="#101613"
        strokeWidth="0.03"
        strokeOpacity="0.45"
        paintOrder="stroke"
      >
        {label.name}
      </text>
    </g>
  );
}

function PhysicalFeatureClipPaths() {
  const atlas = ANATOLIA_PHYSICAL_ATLAS_RUNTIME;
  const landPath = polygonPath(atlas.landPolygons);
  const lakePath = atlas.lakes.map((lake) => exactAreaPath(lake.rings ?? [lake.coordinates])).filter(Boolean).join(" ");
  return (
    <defs>
      <clipPath id={ANATOLIA_LAND_CLIP_ID} clipPathUnits="userSpaceOnUse">
        <path d={landPath} fillRule="evenodd" />
      </clipPath>
      <clipPath id={ANATOLIA_TERRAIN_LAND_CLIP_ID} clipPathUnits="userSpaceOnUse">
        <path d={`${landPath} ${lakePath}`} fillRule="evenodd" />
      </clipPath>
    </defs>
  );
}

function PhysicalGeographyLayer({ phase = "detail", zoom = 1, camera }) {
  const atlas = ANATOLIA_PHYSICAL_ATLAS_RUNTIME;
  const profile = getPhysicalDetailProfile(zoom);
  const presentation = getPhysicalPresentation(zoom);
  const stroke = getPhysicalStrokeProfile(zoom);

  if (phase === "base" || phase === "water") return null;

  const visibleMountains = profile.mountains
    ? atlas.mountainRanges.filter((range) => profile.minorRivers || range.rank === 1).filter((range) => isFeatureVisible(range, camera))
    : [];
  const labels = profile.physicalLabels
    ? layoutPhysicalLabels(atlas.labels.filter((label) => isFeatureVisible({ coordinates: [[label.x, label.y]] }, camera)), zoom)
    : [];

  if (phase === "terrain") {
    return (
      <g aria-label="Anatolia physical terrain detail">
        <PhysicalFeatureClipPaths />
        <g clipPath={`url(#${ANATOLIA_TERRAIN_LAND_CLIP_ID})`}>
          {visibleMountains.map((range) => (
            <PhysicalLine
              key={range.name}
              feature={range}
              className="map-mountain"
              width={range.rank === 1 ? stroke.mountain : stroke.minorMountain}
              opacity={range.rank === 1 ? presentation.mountainOpacity : presentation.mountainOpacity * 0.68}
            />
          ))}
        </g>
      </g>
    );
  }

  if (phase === "labels") {
    return <g aria-label="Anatolia physical labels">{profile.mountainLabels && labels.map((label) => <PhysicalLabel key={label.id} label={label} />)}</g>;
  }

  const visibleRivers = profile.rivers ? filterVisibleRivers(atlas.rivers, zoom).filter((river) => isFeatureVisible(river, camera)) : [];
  const visibleLakes = profile.lakes ? filterVisibleLakes(atlas.lakes, zoom).filter((lake) => isFeatureVisible(lake, camera)) : [];

  return (
    <g aria-label="Anatolia physical geography detail">
      <PhysicalFeatureClipPaths />
      {visibleLakes.map((lake) => (
        <PhysicalPolygon key={lake.id ?? `${lake.name}-${lake.bounds?.join("-")}`} feature={lake} className="map-lake" opacity={presentation.lakeOpacity} />
      ))}
      <g clipPath={`url(#${ANATOLIA_TERRAIN_LAND_CLIP_ID})`}>
        {visibleMountains.map((range) => <PhysicalLine key={range.name} feature={range} className="map-mountain" width={range.rank === 1 ? stroke.mountain : stroke.minorMountain} opacity={presentation.mountainOpacity} />)}
      </g>
      <g clipPath={`url(#${ANATOLIA_LAND_CLIP_ID})`}>
        {visibleRivers.map((river) => (
          <PhysicalLine
            key={river.id ?? `${river.name}-${river.bounds?.join("-")}`}
            feature={river}
            className="map-river"
            underClassName="map-river-under"
            width={river.rank === 1 ? stroke.river : stroke.minorRiver}
            underWidth={river.rank === 1 ? stroke.river + 1.1 : stroke.minorRiver + 0.8}
            opacity={river.rank === 1 ? presentation.riverOpacity : presentation.riverOpacity * 0.72}
          />
        ))}
      </g>
      {profile.mountainLabels && labels.map((label) => <PhysicalLabel key={label.id} label={label} />)}
    </g>
  );
}

export default PhysicalGeographyLayer;
