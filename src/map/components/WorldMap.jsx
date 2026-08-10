import { useWorldMap } from "../hooks";
import { ProvinceLayer } from "./layers";
import { CameraController, CameraProvider, CameraViewport, useCamera } from "../camera";
import { RenderRoot, RenderLayer, SvgRenderer } from "../rendering";

function WorldMap({ runtime, selectedProvinceId, onProvinceClick, settings = {} }) {
  const { provinces } = useWorldMap(runtime);
  const camera = useCamera();

  return (
    <CameraProvider value={camera}>
      <CameraController
        zoom={camera.zoom}
        move={camera.move}
        smooth={settings.smoothCamera !== false}
      />
      <CameraViewport>
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
