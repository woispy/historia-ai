import { memo } from "react";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../data/AnatoliaPhysicalAtlasRuntime.js";
import { getPhysicalDetailProfile, getPhysicalPresentation, getPhysicalStrokeProfile } from "../../rendering/CartographyModel.js";
import { getViewportBounds } from "../../rendering/MapViewportCulling.js";
import { exactAreaPath, flattenCoordinatePoints, linearPathFromCoordinates, polygonPath } from "../../rendering/physical/PhysicalGeometryPath.js";
import { filterVisibleLakes, filterVisibleRivers } from "../../rendering/physical/PhysicalFeatureVisibility.js";
import { layoutPhysicalLabels } from "../../rendering/physical/PhysicalLabelLayout.js";

const ANATOLIA_LAND_CLIP_ID = "physical-anatolia-land-clip";
const ANATOLIA_TERRAIN_LAND_CLIP_ID = "physical-anatolia-terrain-land-clip";

function midpoint(a, b) {
  return [(Number(a[0]) + Number(b[0])) / 2, (Number(a[1]) + Number(b[1])) / 2];
}

function smoothPathFromCoordinates(coordinates, close = false) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return "";
  const points = coordinates.filter((point) => Array.isArray(point) && point.length >= 2);
  if (points.length < 2) return "";

  if (!close) {
    if (points.length === 2) return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`;
    const commands = [`M ${points[0][0]} ${points[0][1]}`];
    for (let index = 1; index < points.length - 1; index += 1) {
      const next = midpoint(points[index], points[index + 1]);
      commands.push(`Q ${points[index][0]} ${points[index][1]} ${next[0]} ${next[1]}`);
    }
    const last = points[points.length - 1];
    commands.push(`Q ${last[0]} ${last[1]} ${last[0]} ${last[1]}`);
    return commands.join(" ");
  }

  const start = midpoint(points[points.length - 1], points[0]);
  const commands = [`M ${start[0]} ${start[1]}`];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const end = midpoint(current, next);
    commands.push(`Q ${current[0]} ${current[1]} ${end[0]} ${end[1]}`);
  }
  commands.push("Z");
  return commands.join(" ");
}

function getFeatureBounds(feature) {
  if (Array.isArray(feature?.bounds) && feature.bounds.length === 4) {
    return {
      minX: Number(feature.bounds[0]),
      minY: Number(feature.bounds[1]),
      maxX: Number(feature.bounds[2]),
      maxY: Number(feature.bounds[3]),
    };
  }
  const points = flattenCoordinatePoints(feature?.coordinates ?? feature?.rings ?? []);
  if (!points.length) return null;
  return points.reduce((bounds, [x, y]) => ({
    minX: Math.min(bounds.minX, x),
    minY: Math.min(bounds.minY, y),
    maxX: Math.max(bounds.maxX, x),
    maxY: Math.max(bounds.maxY, y),
  }), {
    minX: points[0][0],
    minY: points[0][1],
    maxX: points[0][0],
    maxY: points[0][1],
  });
}

function isFeatureVisible(feature, camera, padding = 0.12) {
  if (!camera) return true;
  const bounds = getFeatureBounds(feature);
  if (!bounds) return false;
  const viewport = getViewportBounds(camera, padding);
  if (bounds.maxY < viewport.minY || bounds.minY > viewport.maxY) return false;
  const worldMin = -180;
  const worldMax = 180;
  const worldWidth = 360;
  const normalize = (value) => {
    let result = Number(value);
    while (result > worldMax) result -= worldWidth;
    while (result < worldMin) result += worldWidth;
    return result;
  };
  const minX = normalize(bounds.minX);
  const maxX = normalize(bounds.maxX);
  if (bounds.minX >= worldMin && bounds.maxX <= worldMax && minX <= maxX) {
    return !(maxX < viewport.minX || minX > viewport.maxX);
  }
  return true;
}

function PhysicalPolygon({ feature, className = "", opacity = 1, exact = false }) {
  const d = exact
    ? exactAreaPath(feature.rings ?? [feature.coordinates])
    : smoothPathFromCoordinates(feature.coordinates, true);
  if (!d) return null;
  return (
    <path
      d={d}
      className={className}
      opacity={opacity}
      pointerEvents="none"
      fillRule={exact ? "evenodd" : undefined}
    />
  );
}

function PhysicalLine({ feature, className = "", underClassName = "", width = 1, underWidth = 0, opacity = 1, exact = false }) {
  const d = exact ? linearPathFromCoordinates(feature.coordinates) : smoothPathFromCoordinates(feature.coordinates);
  if (!d) return null;
  return (
    <g pointerEvents="none">
      {underWidth > 0 && (
        <path
          d={d}
          className={underClassName}
          fill="none"
          strokeWidth={underWidth}
          opacity={opacity * 0.72}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <path
        d={d}
        className={className}
        fill="none"
        strokeWidth={width}
        opacity={opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function PhysicalLabel({ label }) {
  const rotation = Number(label.rotation ?? 0);
  const transform = `translate(${label.x} ${label.y}) rotate(${rotation}) scale(1,-1)`;
  return (
    <g transform={transform} pointerEvents="none">
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
  const lakePath = atlas.lakes
    .map((lake) => exactAreaPath(lake.rings ?? [lake.coordinates]))
    .filter(Boolean)
    .join(" ");

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

  if (phase === "base") return null;

  if (phase === "water") {
    if (!profile.waterChannels) return null;
    return (
      <g aria-label="Anatolia physical water details">
        {atlas.channels
          .filter((channel) => isFeatureVisible(channel, camera))
          .map((channel) => (
            <PhysicalPolygon key={channel.name} feature={channel} className="map-sea-channel" opacity={0.88} exact />
          ))}
      </g>
    );
  }

  const labels = profile.physicalLabels
    ? layoutPhysicalLabels(atlas.labels.filter((label) => isFeatureVisible({ coordinates: [[label.x, label.y]] }, camera)), zoom)
    : [];
  const visibleMountains = profile.mountains
    ? atlas.mountainRanges.filter((range) => profile.minorRivers || range.rank === 1).filter((range) => isFeatureVisible(range, camera))
    : [];
  const visibleRivers = profile.rivers
    ? filterVisibleRivers(atlas.rivers, zoom).filter((river) => isFeatureVisible(river, camera))
    : [];
  const visibleLakes = profile.lakes
    ? filterVisibleLakes(atlas.lakes, zoom).filter((lake) => isFeatureVisible(lake, camera))
    : [];

  return (
    <g aria-label="Anatolia physical geography detail">
      <PhysicalFeatureClipPaths />

      {visibleLakes.map((lake) => (
        <PhysicalPolygon
          key={lake.id ?? `${lake.name}-${lake.bounds?.join("-")}`}
          feature={lake}
          className="map-lake"
          opacity={presentation.lakeOpacity}
          exact
        />
      ))}

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
            exact
          />
        ))}
      </g>

      {profile.mountainLabels && labels.map((label) => <PhysicalLabel key={label.id} label={label} />)}
    </g>
  );
}

export default memo(PhysicalGeographyLayer, (previous, next) => (
  previous.phase === next.phase
  && previous.zoom === next.zoom
  && previous.camera === next.camera
));
