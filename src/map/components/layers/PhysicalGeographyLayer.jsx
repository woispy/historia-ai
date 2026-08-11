import { ANATOLIA_PHYSICAL_ATLAS } from "../../data/AnatoliaPhysicalAtlas";
import { layoutPhysicalLabels } from "../../rendering/physical/PhysicalLabelLayout";

function pathFromCoordinates(coordinates, close = false) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return "";
  const [first, ...rest] = coordinates;
  const commands = [`M ${first[0]} ${first[1]}`];
  for (const [x, y] of rest) commands.push(`L ${x} ${y}`);
  if (close) commands.push("Z");
  return commands.join(" ");
}

function pathFromPolygons(polygons = []) {
  return polygons
    .map((polygon) => pathFromCoordinates(polygon, true))
    .filter(Boolean)
    .join(" ");
}

function PhysicalPolygon({ feature, className = "", opacity = 1 }) {
  const d = pathFromCoordinates(feature.coordinates, true);
  if (!d) return null;

  return (
    <path
      d={d}
      className={className}
      opacity={opacity}
      pointerEvents="none"
    />
  );
}

function PhysicalLine({ feature, className = "", width = 0.12, opacity = 1, close = false }) {
  const d = pathFromCoordinates(feature.coordinates, close);
  if (!d) return null;

  return (
    <path
      d={d}
      className={className}
      fill="none"
      strokeWidth={width}
      opacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      pointerEvents="none"
    />
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
        opacity={label.kind === "sea" ? 0.62 : 0.34}
        stroke="#101613"
        strokeWidth={label.kind === "sea" ? 0.035 : 0.03}
        paintOrder="stroke"
        vectorEffect="non-scaling-stroke"
      >
        {label.name}
      </text>
    </g>
  );
}

function WaterMask({ id = "physical-water-mask" }) {
  const { bbox, landPolygons } = ANATOLIA_PHYSICAL_ATLAS;
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const outer = [
    [minLon, minLat],
    [maxLon, minLat],
    [maxLon, maxLat],
    [minLon, maxLat],
  ];

  return (
    <clipPath id={id} clipPathUnits="userSpaceOnUse">
      <path
        d={`${pathFromCoordinates(outer, true)} ${pathFromPolygons(landPolygons)}`}
        fillRule="evenodd"
      />
    </clipPath>
  );
}

function PhysicalGeographyLayer({ phase = "detail", zoom = 1 }) {
  const atlas = ANATOLIA_PHYSICAL_ATLAS;

  if (phase === "base") {
    return (
      <g aria-label="Physical geography base">
        <g aria-label="Physical land mass">
          {atlas.landPolygons.map((polygon, index) => (
            <PhysicalPolygon
              key={`land-${index}`}
              feature={{ coordinates: polygon }}
              className="map-land-base"
              opacity={1}
            />
          ))}
        </g>
        {atlas.terrainRegions.map((region) => (
          <PhysicalPolygon
            key={region.name}
            feature={region}
            className={`map-terrain-${region.type}`}
            opacity={0.16}
          />
        ))}
      </g>
    );
  }

  if (phase === "water") {
    const waterClipId = "physical-water-mask";

    return (
      <g aria-label="Physical geography water">
        <defs>
          <WaterMask id={waterClipId} />
        </defs>
        <g clipPath={`url(#${waterClipId})`}>
          {atlas.seas.map((sea) => (
            <PhysicalPolygon
              key={sea.name}
              feature={sea}
              className={sea.kind === "gulf" ? "map-gulf" : "map-sea"}
              opacity={sea.kind === "gulf" ? 0.96 : 0.98}
            />
          ))}
        </g>
        {atlas.channels.map((channel) => (
          <PhysicalPolygon
            key={channel.name}
            feature={channel}
            className="map-sea-channel"
            opacity={0.98}
          />
        ))}
      </g>
    );
  }

  const labels = layoutPhysicalLabels(atlas.labels, zoom);

  return (
    <g aria-label="Physical geography detail">
      {atlas.lakes.map((lake) => (
        <PhysicalPolygon key={lake.name} feature={lake} className="map-lake" opacity={0.84} />
      ))}
      {atlas.mountainRanges.map((range) => (
        <PhysicalLine
          key={range.name}
          feature={range}
          className="map-mountain"
          width={range.rank === 1 ? 0.11 : 0.075}
          opacity={range.rank === 1 ? 0.20 : 0.13}
        />
      ))}
      {atlas.rivers.map((river) => (
        <PhysicalLine
          key={river.name}
          feature={river}
          className="map-river"
          width={river.rank === 1 ? 0.11 : 0.075}
          opacity={river.rank === 1 ? 0.72 : 0.48}
        />
      ))}
      {atlas.landPolygons.map((polygon, index) => (
        <PhysicalLine
          key={`coast-${index}`}
          feature={{ coordinates: polygon }}
          className="map-coastline"
          width={0.13}
          opacity={0.78}
          close
        />
      ))}
      {atlas.islands.map((island) => (
        <PhysicalPolygon key={island.name} feature={island} className="map-island" opacity={0.92} />
      ))}
      {labels.map((label) => (
        <PhysicalLabel key={label.id} label={label} />
      ))}
    </g>
  );
}

export default PhysicalGeographyLayer;
