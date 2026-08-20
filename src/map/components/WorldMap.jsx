import { useCallback, useMemo, useState } from "react";
import { useWorldMap } from "../hooks";
import { getAnatoliaCityMapMetadata } from "../data/AnatoliaCityAtlas";
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
import { shouldUseGpuProvinceFill } from "../rendering/CartographyModel";

const focusZoom = (metadata) => (
  metadata?.tier === "capital" ? 3.6 : metadata?.tier === "major" ? 3 : 2.55
);

function WorldMap({
  runtime,
  selectedProvinceId,
  onProvinceClick,
  onCityClick,
  settings = {},
}) {
  const { provinces, cities } = useWorldMap(runtime);
  const camera = useCamera();
  const cameraState = camera.camera;
  const [textureReady, setTextureReady] = useState(false);

  const cameraInput = useCameraController({
    zoom: camera.zoom,
    move: camera.move,
    smooth: settings.smoothCamera !== false,
  });

  const ready = useCallback((value) => setTextureReady(Boolean(value)), []);

  const cityClick = useCallback((cityId, cityMap) => {
    const metadata = cityMap ?? getAnatoliaCityMapMetadata(cityId);
    if (metadata) {
      camera.focus(metadata.x, metadata.y, { type: "city", id: cityId });
      camera.setZoom(focusZoom(metadata));
    }
    onCityClick?.(cityId);
  }, [camera, onCityClick]);

  const useGpuProvinceFill = shouldUseGpuProvinceFill(cameraState.zoom);
  const gpuProvinceActive = useGpuProvinceFill && textureReady;

  const world = useMemo(
    () => <WorldPhysicalLayer zoom={cameraState.zoom} />,
    [cameraState.zoom],
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
        onCityClick={cityClick}
      />
    ),
    [cities, cameraState, cityClick],
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
