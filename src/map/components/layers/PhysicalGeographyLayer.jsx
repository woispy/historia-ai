import { ANATOLIA_PHYSICAL_ATLAS } from "../../data/AnatoliaPhysicalAtlas";
import { getPhysicalDetailProfile, getPhysicalPresentation } from "../../rendering/CartographyModel";
import { layoutPhysicalLabels } from "../../rendering/physical/PhysicalLabelLayout";

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
  return <path d={d} className={className} opacity={opacity} pointerEvents="none" />;
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
        strokeWidth={label.kind === "sea" ? 0.03 : 0.025}
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
  const profile = getPhysicalDetailProfile(zoom);
  const presentation = getPhysicalPresentation(zoom);

  if (phase === "base") {
    return (
      <g aria-label="Anatolia terrain context">
        {atlas.terrainRegions.map((region) => (
          <PhysicalPolygon
            key={region.name}
            feature={region}
            className={`map-terrain-${region.type}`}
            opacity={presentation.terrainOpacity}
          />
        ))}
      </g>
    );
  }

  if (phase === "water") {
    if (!profile.waterChannels) return null;
    return (
      <g aria-label="Anatolia physical water details">
        {atlas.channels.map((channel) => (
          <PhysicalPolygon key={channel.name} feature={channel} className="map-sea-channel" opacity={0.88} />
        ))}
      </g>
    );
  }

  const labels = profile.physicalLabels ? layoutPhysicalLabels(atlas.labels, zoom) : [];
  const visibleMountains = profile.mountains
    ? atlas.mountainRanges.filter((range) => profile.minorRivers || range.rank === 1)
    : [];
  const visibleRivers = profile.rivers
    ? atlas.rivers.filter((river) => profile.minorRivers || river.rank === 1)
    : [];

  return (
    <g aria-label="Anatolia physical geography detail">
      {profile.lakes && atlas.lakes.map((lake) => (
        <PhysicalPolygon
          key={lake.name}
          feature={lake}
          className="map-lake"
          opacity={presentation.lakeOpacity}
        />
      ))}
      {visibleMountains.map((range) => (
        <PhysicalLine
          key={range.name}
          feature={range}
          className="map-mountain"
          width={range.rank === 1 ? 0.10 : 0.065}
          opacity={range.rank === 1 ? presentation.mountainOpacity : presentation.mountainOpacity * 0.68}
        />
      ))}
      {visibleRivers.map((river) => (
        <PhysicalLine
          key={river.name}
          feature={river}
          className="map-river"
          width={river.rank === 1 ? 0.10 : 0.065}
          opacity={river.rank === 1 ? presentation.riverOpacity : presentation.riverOpacity * 0.72}
        />
      ))}
      {profile.mountainLabels && labels.map((label) => <PhysicalLabel key={label.id} label={label} />)}
    </g>
  );
}

export default PhysicalGeographyLayer;
