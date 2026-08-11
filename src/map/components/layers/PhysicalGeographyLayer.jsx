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
  const fontSize = isSea ? 0.30 : 0.25;

  return (
    <g transform={`translate(${label.x} ${label.y}) scale(1,-1)`} pointerEvents="none">
      <text
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize={fontSize}
        fontWeight="700"
        letterSpacing={isSea ? "0.055" : "0.025"}
        fill={isSea ? "#8ea9af" : "#77735f"}
        opacity={isSea ? 0.68 : 0.42}
        stroke="#121613"
        strokeWidth="0.045"
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
        {atlas.terrainRegions.map((region) => (
          <PhysicalPolygon
            key={region.name}
            feature={region}
            className={`map-terrain-${region.type}`}
            opacity={0.10}
          />
        ))}
      </g>
    );
  }

  if (phase === "water") {
    return (
      <g aria-label="Physical geography water">
        {atlas.seas.map((sea) => (
          <PhysicalPolygon
            key={sea.name}
            feature={sea}
            className="map-sea"
            opacity={0.94}
          />
        ))}
      </g>
    );
  }

  return (
    <g aria-label="Physical geography detail">
      {atlas.lakes.map((lake) => (
        <PhysicalPolygon key={lake.name} feature={lake} className="map-lake" opacity={0.82} />
      ))}
      {atlas.mountainRanges.map((range) => (
        <PhysicalLine key={range.name} feature={range} className="map-mountain" width={0.11} opacity={0.20} />
      ))}
      {atlas.rivers.map((river) => (
        <PhysicalLine
          key={river.name}
          feature={river}
          className="map-river"
          width={river.rank === 1 ? 0.11 : 0.075}
          opacity={river.rank === 1 ? 0.72 : 0.52}
        />
      ))}
      {atlas.coastlines.map((coast) => (
        <PhysicalLine
          key={coast.name}
          feature={coast}
          className="map-coastline"
          width={0.12}
          opacity={0.72}
        />
      ))}
      {atlas.islands.map((island) => (
        <PhysicalPolygon key={island.name} feature={island} className="map-island" opacity={0.92} />
      ))}
      {atlas.labels.map((label) => (
        <PhysicalLabel key={label.id} label={label} zoom={zoom} />
      ))}
    </g>
  );
}

export default PhysicalGeographyLayer;
