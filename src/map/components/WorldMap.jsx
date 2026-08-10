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
  });

  return (
    <CameraProvider value={camera}>
      <CameraViewport cameraInput={cameraInput}>
        <RenderRoot>
          <SvgRenderer camera={camera.camera}>
            <RenderLayer>
              <ProvinceLayer
                provinces={provinces}
                selectedProvinceId={selectedProvinceId}
                onProvinceClick={onProvinceClick}
                mapStyle={settings.mapStyle ?? "detailed"}
                mapShadows={settings.mapShadows !== false}
              />
            </RenderLayer>
          </SvgRenderer>
        </RenderRoot>
      </CameraViewport>
    </CameraProvider>
  );
}

export default WorldMap;
