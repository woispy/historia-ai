import { useCallback, useMemo, useState } from "react";
import { useWorldMap } from "../hooks";
import {
  ProvinceLayer,
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

  // Camera transform remains continuous. Expensive geometry visibility/layout
  // work uses a coarse snapshot so panning does not reconcile every SVG path
  // on every animation frame.
  const cullingKey = getCameraCullingKey(cameraState);
  const cullingCamera = useMemo(
    () => getCameraCullingSnapshot(cameraState),
    [cullingKey],
  );

  const world = useMemo(
    () => <WorldPhysicalLayer />,
    [],
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
        renderFill={!gpuProvinceActive}
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
        {cartography}
        {detail}
        {citiesLayer}
      </RenderLayer>
    ),
    [world, provincesLayer, cartography, detail, citiesLayer],
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
