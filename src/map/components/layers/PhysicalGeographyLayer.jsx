import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../data/AnatoliaPhysicalAtlasRuntime.js";
import { getPhysicalDetailProfile, getPhysicalPresentation, getPhysicalStrokeProfile } from "../../rendering/CartographyModel.js";
import { getViewportBounds } from "../../rendering/MapViewportCulling.js";
import { exactAreaPath, flattenCoordinatePoints, polygonPath } from "../../rendering/physical/PhysicalGeometryPath.js";
import { layoutPhysicalLabels } from "../../rendering/physical/PhysicalLabelLayout.js";

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
  const points = flattenCoordinatePoints(feature?.coordinates ?? []);
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
  const minX = Math.max(-180, Number(bounds.minX));
  const maxX = Math.min(180, Number(bounds.maxX));
  return !(maxX < viewport.minX || minX > viewport.maxX);
}

function PhysicalLine({ feature, className = "", width = 1, opacity = 1 }) {
  const d = linearPathFromCoordinates(feature.coordinates);
  if (!d) return null;
  return <path d={d} className={className} fill="none" strokeWidth={width} opacity={opacity} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" />;
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

function TerrainClipPath() {
  const atlas = ANATOLIA_PHYSICAL_ATLAS_RUNTIME;
  const landPath = polygonPath(atlas.landPolygons);
  const lakePath = atlas.lakes.map((lake) => exactAreaPath(lake.rings ?? [lake.coordinates])).filter(Boolean).join(" ");
  return (
    <defs>
      <clipPath id={ANATOLIA_TERRAIN_LAND_CLIP_ID} clipPathUnits="userSpaceOnUse">
        <path d={`${landPath} ${lakePath}`} fillRule="evenodd" />
      </clipPath>
    </defs>
  );
}

function PhysicalGeographyLayer({ phase = "terrain", zoom = 1, camera }) {
  const atlas = ANATOLIA_PHYSICAL_ATLAS_RUNTIME;
  const profile = getPhysicalDetailProfile(zoom);
  const presentation = getPhysicalPresentation(zoom);
  const stroke = getPhysicalStrokeProfile(zoom);

  if (phase === "labels") {
    if (!profile.mountainLabels || !profile.physicalLabels) return null;
    const labels = layoutPhysicalLabels(
      atlas.labels.filter((label) => isFeatureVisible({ coordinates: [[label.x, label.y]] }, camera)),
      zoom,
    );
    return <g aria-label="Anatolia physical labels">{labels.map((label) => <PhysicalLabel key={label.id} label={label} />)}</g>;
  }

  if (phase !== "terrain" || !profile.mountains) return null;
  const visibleMountains = atlas.mountainRanges
    .filter((range) => profile.minorRivers || range.rank === 1)
    .filter((range) => isFeatureVisible(range, camera));

  return (
    <g aria-label="Anatolia physical terrain detail">
      <TerrainClipPath />
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

export default PhysicalGeographyLayer;
