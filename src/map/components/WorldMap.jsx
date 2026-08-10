import { useMemo } from "react";
import { useWorldMap } from "../hooks";
import { ProvinceLayer } from "./layers";
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
  settings = {},
}) {
  const { provinces } = useWorldMap(runtime);
  const camera = useCamera();
  const cameraInput = useCameraController({
    zoom: camera.zoom,
    move: camera.move,
    smooth: settings.smoothCamera !== false,
  });

  // Camera movement should only update the SVG viewBox. Keep the expensive
  // province element tree stable so React does not reconcile thousands of
  // paths on every animation frame.
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

  const renderLayer = useMemo(() => (
    <RenderLayer>{provinceLayer}</RenderLayer>
  ), [provinceLayer]);

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
