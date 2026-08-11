import { useMemo } from "react";
import { useWorldMap } from "../hooks";
import { ProvinceLayer, CityLayer } from "./layers";
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

  const cityLayer = useMemo(() => (
    <CityLayer
      cities={cities}
      zoom={camera.zoom}
      onCityClick={onCityClick}
    />
  ), [cities, camera.zoom, onCityClick]);

  const renderLayer = useMemo(() => (
    <RenderLayer>
      {provinceLayer}
      {cityLayer}
    </RenderLayer>
  ), [provinceLayer, cityLayer]);

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
