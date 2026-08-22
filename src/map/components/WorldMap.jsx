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
import { shouldUseGpuProvinceFill } from "../rendering/CartographyModel";

function WorldMap({
  runtime,
  selectedProvinceId,
  onProvinceClick,
  onCityClick,
  selectedCityId: controlledSelectedCityId = null,
  settings = {},
}) {
  const { provinces, cities } = useWorldMap(runtime);
  const camera = useCamera();
  const cameraState = camera.camera;
  const [textureReady, setTextureReady] = useState(false);
  const [internalSelectedCityId, setInternalSelectedCityId] = useState(null);
  const selectedCityId = controlledSelectedCityId ?? internalSelectedCityId;

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

  const useGpuProvinceFill = shouldUseGpuProvinceFill(cameraState.zoom);
  const gpuProvinceActive = useGpuProvinceFill && textureReady;

  const world = useMemo(
    () => <WorldPhysicalLayer zoom={cameraState.zoom} />,
    [cameraState.zoom],
  );

  const politicalRegions = useMemo(
    () => <HistoricalPoliticalRegionLayer date={runtime?.scenario?.startDate ?? "1300-01-01"} />,
    [runtime?.scenario?.startDate],
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
        camera={cameraState}
        renderFill={!gpuProvinceActive}
      />
    ),
    [
      provinces,
      selectedProvinceId,
      onProvinceClick,
      settings.mapStyle,
      settings.mapShadows,
      cameraState,
      gpuProvinceActive,
    ],
  );

  const cartography = useMemo(
    () => <CartographyLayer zoom={cameraState.zoom} />,
    [cameraState.zoom],
  );
  const detail = useMemo(
    () => <PhysicalGeographyLayer phase="detail" zoom={cameraState.zoom} camera={cameraState} />,
    [cameraState],
  );
  const citiesLayer = useMemo(
    () => (
      <CityLayer
        cities={cities}
        zoom={cameraState.zoom}
        camera={cameraState}
        selectedCityId={selectedCityId}
        onCityClick={cityClick}
      />
    ),
    [cities, cameraState, selectedCityId, cityClick],
  );
  const layers = useMemo(
    () => (
      <RenderLayer>
        {world}
        {politicalRegions}
        {provincesLayer}
        {cartography}
        {detail}
        {citiesLayer}
      </RenderLayer>
    ),
    [world, politicalRegions, provincesLayer, cartography, detail, citiesLayer],
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
