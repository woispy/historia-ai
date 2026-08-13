import { useCallback, useMemo } from "react";
import { useWorldMap } from "../hooks";
import { getAnatoliaCityMapMetadata } from "../data/AnatoliaCityAtlas";
import {
  CityLayer,
  PhysicalGeographyLayer,
  WorldPhysicalLayer,
  CartographyLayer,
  ProvinceBoundaryLayer,
} from "./layers";
import {
  CameraProvider,
  CameraViewport,
  useCamera,
  useCameraController,
} from "../camera";
import {
  ProvinceGpuRenderer,
  RenderRoot,
  RenderLayer,
  SvgRenderer,
} from "../rendering";

function getCityFocusZoom(cityMap) {
  if (cityMap?.tier === "capital") return 3.6;
  if (cityMap?.tier === "major") return 3.0;
  return 2.55;
}

function WorldMap({
  runtime,
  selectedProvinceId,
  onProvinceClick,
  onCityClick,
  settings = {},
}) {
  const { provinces, cities } = useWorldMap(runtime);
  const camera = useCamera();
  const cameraInput = useCameraController({
    zoom: camera.zoom,
    move: camera.move,
    smooth: settings.smoothCamera !== false,
  });

  const handleCityClick = useCallback((cityId, cityMap) => {
    const metadata = cityMap ?? getAnatoliaCityMapMetadata(cityId);
    if (metadata) {
      camera.focus(metadata.x, metadata.y, { type: "city", id: cityId });
      camera.setZoom(getCityFocusZoom(metadata));
    }
    onCityClick?.(cityId);
  }, [camera, onCityClick]);

  const worldPhysicalLayer = useMemo(() => <WorldPhysicalLayer />, []);
  const physicalBaseLayer = useMemo(
    () => <PhysicalGeographyLayer phase="base" zoom={camera.zoom} />,
    [camera.zoom],
  );
  const boundaryLayer = useMemo(
    () => <ProvinceBoundaryLayer provinces={provinces} zoom={camera.zoom} />,
    [provinces, camera.zoom],
  );
  const cartographyLayer = useMemo(
    () => <CartographyLayer zoom={camera.zoom} />,
    [camera.zoom],
  );
  const physicalWaterLayer = useMemo(
    () => <PhysicalGeographyLayer phase="water" zoom={camera.zoom} />,
    [camera.zoom],
  );
  const physicalDetailLayer = useMemo(
    () => <PhysicalGeographyLayer phase="detail" zoom={camera.zoom} />,
    [camera.zoom],
  );
  const cityLayer = useMemo(
    () => <CityLayer cities={cities} zoom={camera.zoom} onCityClick={handleCityClick} />,
    [cities, camera.zoom, handleCityClick],
  );

  const renderLayer = useMemo(() => (
    <RenderLayer>
      {worldPhysicalLayer}
      {physicalBaseLayer}
      {boundaryLayer}
      {cartographyLayer}
      {physicalWaterLayer}
      {physicalDetailLayer}
      {cityLayer}
    </RenderLayer>
  ), [
    worldPhysicalLayer,
    physicalBaseLayer,
    boundaryLayer,
    cartographyLayer,
    physicalWaterLayer,
    physicalDetailLayer,
    cityLayer,
  ]);

  return (
    <CameraProvider value={camera}>
      <CameraViewport cameraInput={cameraInput}>
        <ProvinceGpuRenderer
          provinces={provinces}
          camera={camera.camera}
          selectedProvinceId={selectedProvinceId}
          onProvinceClick={onProvinceClick}
          enabled={settings.gpuMap !== false}
        />
        <RenderRoot>
          <SvgRenderer camera={camera.camera}>
            {renderLayer}
          </SvgRenderer>
        </RenderRoot>
      </CameraViewport>
    </CameraProvider>
  );
}

export default WorldMap;
