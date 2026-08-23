import { useCallback, useMemo, useState } from "react";
import { useWorldMap } from "../hooks";
import {
  ProvinceLayer,
  HistoricalPoliticalRegionLayer,
  CityLayer,
  PhysicalGeographyLayer,
  WorldPhysicalLayer,
  CartographyLayer,
} from "./layers";
import { CameraProvider, CameraViewport, useCamera, useCameraController } from "../camera";
import { RenderRoot, RenderLayer, SvgRenderer } from "../rendering";
import ProvinceTextureLayer from "../rendering/gpu/ProvinceTextureLayer";
import { getCameraCullingKey, getCameraCullingSnapshot } from "../rendering/MapViewportCulling";
import { shouldUseGpuProvinceFill } from "../rendering/CartographyModel";

const HISTORICAL_1300_DATE = "1300-01-01";

function getScenarioStartDate(runtime) {
  return runtime?.scenario?.startDate
    ?? runtime?.world?.scenario?.startDate
    ?? null;
}

function WorldMap({
  runtime,
  selectedProvinceId,
  onProvinceClick,
  onCityClick,
  selectedCityId: controlledSelectedCityId = null,
  settings = {},
}) {
  const { provinces, cities, historicalRegions } = useWorldMap(runtime);
  const camera = useCamera();
  const cameraState = camera.camera;
  const [textureReady, setTextureReady] = useState(false);
  const [internalSelectedCityId, setInternalSelectedCityId] = useState(null);
  const selectedCityId = controlledSelectedCityId ?? internalSelectedCityId;
  const scenarioDate = getScenarioStartDate(runtime);
  const isHistoricalPoliticalMap = scenarioDate === HISTORICAL_1300_DATE;

  const cameraInput = useCameraController({
    zoom: camera.zoom,
    move: camera.move,
    smooth: settings.smoothCamera !== false,
  });

  const ready = useCallback((value) => setTextureReady(Boolean(value)), []);

  const cityClick = useCallback((cityId) => {
    setInternalSelectedCityId(cityId);
    onCityClick?.(cityId);
  }, [onCityClick]);

  // The GPU province compositor remains the default performance path, but it
  // must not compete with the authoritative dated political renderer.
  const useGpuProvinceFill = !isHistoricalPoliticalMap
    && shouldUseGpuProvinceFill(cameraState.zoom);
  const gpuProvinceActive = useGpuProvinceFill && textureReady;

  // Camera transform remains continuous. Expensive geometry visibility/layout
  // work uses a coarse snapshot so panning does not reconcile every SVG path
  // on every animation frame. The key is the intentional memo boundary;
  // cameraState is the source object consumed by the snapshot helper.
  const cullingKey = getCameraCullingKey(cameraState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cullingCamera = useMemo(
    () => getCameraCullingSnapshot(cameraState),
    [cullingKey],
  );

  const world = useMemo(
    () => <WorldPhysicalLayer />,
    [],
  );

  const politicalRegions = useMemo(
    () => (
      <HistoricalPoliticalRegionLayer
        date={scenarioDate}
        provinces={provinces}
        regions={historicalRegions}
      />
    ),
    [scenarioDate, provinces, historicalRegions],
  );

  const provincesLayer = useMemo(
    () => (
      <ProvinceLayer
        provinces={provinces}
        selectedProvinceId={selectedProvinceId}
        onProvinceClick={onProvinceClick}
        mapStyle={settings.mapStyle ?? "detailed"}
        mapShadows={settings.mapShadows !== false}
        zoom={cameraState.zoom}
        camera={cullingCamera}
        renderFill={!isHistoricalPoliticalMap && !gpuProvinceActive}
      />
    ),
    [
      provinces,
      selectedProvinceId,
      onProvinceClick,
      settings.mapStyle,
      settings.mapShadows,
      cameraState.zoom,
      cullingCamera,
      gpuProvinceActive,
      isHistoricalPoliticalMap,
    ],
  );

  const cartography = useMemo(
    () => <CartographyLayer zoom={cameraState.zoom} />,
    [cameraState.zoom],
  );
  const detail = useMemo(
    () => <PhysicalGeographyLayer phase="detail" zoom={cameraState.zoom} camera={cullingCamera} />,
    [cameraState.zoom, cullingCamera],
  );
  const citiesLayer = useMemo(
    () => (
      <CityLayer
        cities={cities}
        zoom={cameraState.zoom}
        camera={cullingCamera}
        selectedCityId={selectedCityId}
        onCityClick={cityClick}
      />
    ),
    [cities, cameraState.zoom, cullingCamera, selectedCityId, cityClick],
  );
  const layers = useMemo(
    () => (
      <RenderLayer>
        {world}
        {provincesLayer}
        {politicalRegions}
        {cartography}
        {detail}
        {citiesLayer}
      </RenderLayer>
    ),
    [world, provincesLayer, politicalRegions, cartography, detail, citiesLayer],
  );

  return (
    <CameraProvider value={camera}>
      <CameraViewport cameraInput={cameraInput}>
        <RenderRoot>
          {useGpuProvinceFill && (
            <ProvinceTextureLayer
              provinces={provinces}
              camera={cameraState}
              selectedProvinceId={selectedProvinceId}
              mapStyle={settings.mapStyle ?? "detailed"}
              onReady={ready}
            />
          )}
          <SvgRenderer camera={cameraState}>{layers}</SvgRenderer>
        </RenderRoot>
      </CameraViewport>
    </CameraProvider>
  );
}

export default WorldMap;
