import { useEffect, useMemo, useRef, useState } from "react";
import { loadHistoricalRuntimeManifest, loadHistoricalRuntimeRegions } from "../../../world/map/loader/HistoricalRuntimeManifestLoader.js";
import { selectHistoricalRuntimeRegionsByBounds } from "../../../world/map/loader/HistoricalRuntimeRegionSelector.js";
import { createHistoricalWorldPoliticalPresentation } from "../../../world/map/historical/HistoricalWorldPoliticalCoverage.js";
import { getVisibleWorldBounds } from "../../camera/viewport/VisibleWorldBoundsService.js";

const HISTORICAL_1300_DATE = "1300-01-01";
const MAX_VISIBLE_REGIONS = 8;

function buildPathData(polygons) {
  if (!Array.isArray(polygons)) return "";
  return polygons.map((polygon) => {
    if (!Array.isArray(polygon) || polygon.length < 3) return "";
    const [first, ...rest] = polygon;
    return [`M ${first[0]} ${first[1]}`, ...rest.map(([x, y]) => `L ${x} ${y}`), "Z"].join(" ");
  }).filter(Boolean).join(" ");
}

function getOverlayMode(entry) {
  const status = String(entry?.historicalProvince?.controlStatus ?? "").toLowerCase();
  if (status.includes("suzerainty")) return "suzerainty";
  if (status.includes("contested") || status.includes("frontier")) return "contested";
  if (!entry?.historicalPolitical?.id || entry.historicalPolitical.id === "local_polities") return "neutral";
  return "sovereign";
}

function getOpacity(mode) {
  if (mode === "neutral") return 0.72;
  if (mode === "contested") return 0.82;
  if (mode === "suzerainty") return 0.88;
  return 0.90;
}

function buildEntries(runtime) {
  const provinceById = new Map((runtime?.provinces ?? []).map((province) => [province?.identity?.id, province]));
  return (runtime?.geometries ?? []).map((geometry) => {
    const id = geometry?.identity?.id;
    const province = provinceById.get(id);
    const political = createHistoricalWorldPoliticalPresentation({ metadata: geometry?.metadata });
    const sourceSubject = String(geometry?.metadata?.subject ?? "").toLowerCase();
    const controlStatus = sourceSubject.includes("ilkhan")
      ? "Ilkhanid-suzerainty"
      : (political.id === "local_polities" ? "historical-source-unresolved" : "historical-source-derived");
    return {
      id,
      geometry,
      historicalPolitical: political,
      historicalProvince: {
        id,
        polityId: political.id === "local_polities" ? null : political.id,
        controlStatus: province?.historical?.controlStatus ?? controlStatus,
        controlConfidence: geometry?.metadata?.borderPrecision >= 3 ? "high" : "medium",
      },
    };
  });
}

function PoliticalDefs() {
  return (
    <defs>
      <pattern id="historical-runtime-suzerainty-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.30)" strokeWidth="2.5" />
      </pattern>
      <pattern id="historical-runtime-contested-hatch" width="9" height="9" patternUnits="userSpaceOnUse">
        <path d="M -2 2 L 2 -2 M 0 9 L 9 0 M 7 11 L 11 7" stroke="rgba(255,255,255,0.26)" strokeWidth="1.4" />
      </pattern>
      <pattern id="historical-runtime-neutral-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M 0 0 L 8 8 M 8 0 L 0 8" stroke="rgba(20,24,20,0.18)" strokeWidth="1" />
      </pattern>
    </defs>
  );
}

function HistoricalRuntimeViewportLayer({ date = HISTORICAL_1300_DATE, camera, viewport, maxRegions = MAX_VISIBLE_REGIONS }) {
  const [manifest, setManifest] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const [error, setError] = useState(null);
  const requestGeneration = useRef(0);

  const bounds = useMemo(() => (viewport ? getVisibleWorldBounds(camera, viewport) : null), [camera, viewport]);
  const regionIds = useMemo(
    () => (manifest && bounds ? selectHistoricalRuntimeRegionsByBounds(manifest, bounds, maxRegions) : []),
    [manifest, bounds, maxRegions],
  );
  const requestedRegionKey = regionIds.join(",");
  const loadedRegionKey = runtime?.loadedRegions?.join(",") ?? "";

  useEffect(() => {
    let cancelled = false;
    loadHistoricalRuntimeManifest(date)
      .then((value) => {
        if (cancelled) return;
        setManifest(value);
        setError(null);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError);
      });
    return () => { cancelled = true; };
  }, [date]);

  useEffect(() => {
    const generation = ++requestGeneration.current;
    if (!regionIds.length) return undefined;

    let cancelled = false;
    loadHistoricalRuntimeRegions(date, regionIds)
      .then((value) => {
        if (cancelled || generation !== requestGeneration.current) return;
        setRuntime(value);
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled || generation !== requestGeneration.current) return;
        setError(loadError);
      });

    return () => { cancelled = true; };
  }, [date, regionIds]);

  const entries = useMemo(
    () => (requestedRegionKey === loadedRegionKey ? buildEntries(runtime) : []),
    [requestedRegionKey, loadedRegionKey, runtime],
  );
  if (date !== HISTORICAL_1300_DATE || error) return null;

  return (
    <g clipPath="url(#world-land-mask)" pointerEvents="none">
      <PoliticalDefs />
      {entries.map((entry) => {
        const d = buildPathData(entry.geometry?.polygons);
        if (!d) return null;
        const mode = getOverlayMode(entry);
        const pattern = mode === "suzerainty"
          ? "url(#historical-runtime-suzerainty-hatch)"
          : mode === "contested"
            ? "url(#historical-runtime-contested-hatch)"
            : mode === "neutral"
              ? "url(#historical-runtime-neutral-hatch)"
              : null;
        return (
          <g key={entry.id}>
            <path d={d} fill={entry.historicalPolitical?.color ?? "#777777"} fillOpacity={getOpacity(mode)} stroke="rgba(24,30,24,0.34)" strokeWidth="0.42" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            {pattern && <path d={d} fill={pattern} fillOpacity={mode === "neutral" ? 0.42 : 0.55} stroke="none" />}
          </g>
        );
      })}
    </g>
  );
}

export default HistoricalRuntimeViewportLayer;
