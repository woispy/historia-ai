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
import WaterRenderer from "../rendering/water/WaterRenderer";
import { shouldUseGpuProvinceFill } from "../rendering/CartographyModel";

const FULL_LAYER_STYLE = Object.freeze({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
});

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

  const terrain = useMemo(
    () => <PhysicalGeographyLayer phase="terrain" zoom={cameraState.zoom} camera={cameraState} />,
    [cameraState],
  );
  const labels = useMemo(
    () => <PhysicalGeographyLayer phase="labels" zoom={cameraState.zoom} camera={cameraState} />,
    [cameraState],
  );
  const baseLayers = useMemo(
    () => (
      <RenderLayer>
        <WorldPhysicalLayer zoom={cameraState.zoom} />
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
        {terrain}
      </RenderLayer>
    ),
    [
      cameraState,
      provinces,
      selectedProvinceId,
      onProvinceClick,
      settings.mapStyle,
      settings.mapShadows,
      gpuProvinceActive,
      terrain,
    ],
  );
  const overlayLayers = useMemo(
    () => (
      <RenderLayer>
        <CityLayer
          cities={cities}
          zoom={cameraState.zoom}
          camera={cameraState}
          selectedCityId={selectedCityId}
          onCityClick={cityClick}
        />
        <CartographyLayer zoom={cameraState.zoom} />
        {labels}
      </RenderLayer>
    ),
    [cities, cameraState, selectedCityId, cityClick, labels],
  );

  return (
    <CameraProvider value={camera}>
      <CameraViewport cameraInput={cameraInput}>
        <RenderRoot>
          <WaterRenderer camera={cameraState} />

          <div style={{ ...FULL_LAYER_STYLE, zIndex: 1 }}>
            <SvgRenderer camera={cameraState}>{baseLayers}</SvgRenderer>
          </div>

          {useGpuProvinceFill && (
            <div style={{ ...FULL_LAYER_STYLE, zIndex: 2 }}>
              <ProvinceTextureLayer
                provinces={provinces}
                camera={cameraState}
                selectedProvinceId={selectedProvinceId}
                mapStyle={settings.mapStyle ?? "detailed"}
                onReady={ready}
              />
            </div>
          )}

          <div style={{ ...FULL_LAYER_STYLE, zIndex: 4 }}>
            <SvgRenderer camera={cameraState}>{overlayLayers}</SvgRenderer>
          </div>
        </RenderRoot>
      </CameraViewport>
    </CameraProvider>
  );
}

export default WorldMap;
