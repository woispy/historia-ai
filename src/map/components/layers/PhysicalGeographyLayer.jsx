import { ANATOLIA_PHYSICAL_ATLAS } from "../../data/AnatoliaPhysicalAtlas";

function pathFromCoordinates(coordinates, close = false) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return "";
  const [first, ...rest] = coordinates;
  const commands = [`M ${first[0]} ${first[1]}`];
  for (const [x, y] of rest) commands.push(`L ${x} ${y}`);
  if (close) commands.push("Z");
  return commands.join(" ");
}

function PhysicalPolygon({ feature, className = "", opacity = 1 }) {
  const d = pathFromCoordinates(feature.coordinates, true);
  if (!d) return null;

  return (
    <path
      d={d}
      className={className}
      opacity={opacity}
      vectorEffect="non-scaling-stroke"
      pointerEvents="none"
    />
  );
}

function PhysicalLine({ feature, className = "", width = 0.12, opacity = 1 }) {
  const d = pathFromCoordinates(feature.coordinates);
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

function PhysicalLabel({ label, zoom }) {
  if (zoom < label.minZoom) return null;

  const isSea = label.kind === "sea";
  return (
    <g transform={`translate(${label.x} ${label.y}) scale(1,-1)`} pointerEvents="none">
      <text
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize={isSea ? 0.58 : 0.48}
        fontWeight="700"
        letterSpacing={isSea ? "0.08" : "0.04"}
        fill={isSea ? "#8ea9af" : "#6f715f"}
        opacity={isSea ? 0.72 : 0.55}
        stroke="#121613"
        strokeWidth="0.08"
        paintOrder="stroke"
        vectorEffect="non-scaling-stroke"
      >
        {label.name}
      </text>
    </g>
  );
}

function PhysicalGeographyLayer({ phase = "detail", zoom = 1 }) {
  const atlas = ANATOLIA_PHYSICAL_ATLAS;

  if (phase === "base") {
    return (
      <g aria-label="Physical geography base">
        {atlas.seas.map((sea) => (
          <PhysicalPolygon key={sea.name} feature={sea} className="map-sea" opacity={0.72} />
        ))}
        {atlas.terrainRegions.map((region) => (
          <PhysicalPolygon key={region.name} feature={region} className={`map-terrain-${region.type}`} opacity={0.13} />
        ))}
      </g>
    );
  }

  return (
    <g aria-label="Physical geography detail">
      {atlas.lakes.map((lake) => (
        <PhysicalPolygon key={lake.name} feature={lake} className="map-lake" opacity={0.88} />
      ))}
      {atlas.mountainRanges.map((range) => (
        <PhysicalLine key={range.name} feature={range} className="map-mountain" width={0.13} opacity={0.28} />
      ))}
      {atlas.rivers.map((river) => (
        <PhysicalLine
          key={river.name}
          feature={river}
          className="map-river"
          width={river.rank === 1 ? 0.13 : 0.09}
          opacity={river.rank === 1 ? 0.84 : 0.62}
        />
      ))}
      {atlas.coastlines.map((coast) => (
        <PhysicalLine key={coast.name} feature={coast} className="map-coastline" width={0.15} opacity={0.9} />
      ))}
      {atlas.islands.map((island) => (
        <PhysicalPolygon key={island.name} feature={island} className="map-island" opacity={0.96} />
      ))}
      {atlas.labels.map((label) => (
        <PhysicalLabel key={label.id} label={label} zoom={zoom} />
      ))}
    </g>
  );
}

export default PhysicalGeographyLayer;
