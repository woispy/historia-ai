import { useCallback, useMemo } from "react";
import { useWorldMap } from "../hooks";
import { getAnatoliaCityMapMetadata } from "../data/AnatoliaCityAtlas";
import {
  ProvinceLayer,
  CityLayer,
  PhysicalGeographyLayer,
  WorldPhysicalLayer,
  CartographyLayer,
} from "./layers";
import {
  CameraProvider,
  CameraViewport,
  useCamera,
  useCameraController,
} from "../camera";
import { RenderRoot, RenderLayer, SvgRenderer } from "../rendering";

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
  const cartographyLayer = useMemo(() => <CartographyLayer zoom={camera.zoom} />, [camera.zoom]);
  const physicalBaseLayer = useMemo(() => <PhysicalGeographyLayer phase="base" zoom={camera.zoom} />, [camera.zoom]);
  const provinceLayer = useMemo(() => (
    <g clipPath="url(#world-landmask)">
      <ProvinceLayer
        provinces={provinces}
        selectedProvinceId={selectedProvinceId}
        onProvinceClick={onProvinceClick}
        mapStyle={settings.mapStyle ?? "detailed"}
        mapShadows={settings.mapShadows !== false}
        zoom={camera.zoom}
      />
    </g>
  ), [provinces, selectedProvinceId, onProvinceClick, settings.mapStyle, settings.mapShadows, camera.zoom]);
  const physicalWaterLayer = useMemo(() => <PhysicalGeographyLayer phase="water" zoom={camera.zoom} />, [camera.zoom]);
  const physicalDetailLayer = useMemo(() => <PhysicalGeographyLayer phase="detail" zoom={camera.zoom} />, [camera.zoom]);
  const cityLayer = useMemo(() => <CityLayer cities={cities} zoom={camera.zoom} onCityClick={handleCityClick} />, [cities, camera.zoom, handleCityClick]);

  const renderLayer = useMemo(() => (
    <RenderLayer>
      {worldPhysicalLayer}
      {cartographyLayer}
      {physicalBaseLayer}
      {provinceLayer}
      {physicalWaterLayer}
      {physicalDetailLayer}
      {cityLayer}
    </RenderLayer>
  ), [worldPhysicalLayer, cartographyLayer, physicalBaseLayer, provinceLayer, physicalWaterLayer, physicalDetailLayer, cityLayer]);

  return (
    <CameraProvider value={camera}>
      <CameraViewport cameraInput={cameraInput}>
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
