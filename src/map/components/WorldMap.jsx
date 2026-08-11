import { useMemo } from "react";
import { useWorldMap } from "../hooks";
import { ProvinceLayer, CityLayer, PhysicalGeographyLayer } from "./layers";
import {
  CameraProvider,
  CameraViewport,
  useCamera,
  useCameraController,
} from "../camera";
import { RenderRoot, RenderLayer, SvgRenderer } from "../rendering";

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

  const physicalBaseLayer = useMemo(() => (
    <PhysicalGeographyLayer phase="base" zoom={camera.zoom} />
  ), [camera.zoom]);

  const provinceLayer = useMemo(() => (
    <ProvinceLayer
      provinces={provinces}
      selectedProvinceId={selectedProvinceId}
      onProvinceClick={onProvinceClick}
      mapStyle={settings.mapStyle ?? "detailed"}
      mapShadows={settings.mapShadows !== false}
    />
  ), [
    provinces,
    selectedProvinceId,
    onProvinceClick,
    settings.mapStyle,
    settings.mapShadows,
  ]);

  const physicalDetailLayer = useMemo(() => (
    <PhysicalGeographyLayer phase="detail" zoom={camera.zoom} />
  ), [camera.zoom]);

  const cityLayer = useMemo(() => (
    <CityLayer
      cities={cities}
      zoom={camera.zoom}
      onCityClick={onCityClick}
    />
  ), [cities, camera.zoom, onCityClick]);

  const renderLayer = useMemo(() => (
    <RenderLayer>
      {physicalBaseLayer}
      {provinceLayer}
      {physicalDetailLayer}
      {cityLayer}
    </RenderLayer>
  ), [physicalBaseLayer, provinceLayer, physicalDetailLayer, cityLayer]);

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
