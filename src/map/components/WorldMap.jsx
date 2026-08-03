import {
  useWorldMap,
} from "../hooks";

import {
  ProvinceLayer,
} from "./layers";

import {
  CameraController,
  CameraProvider,
  CameraViewport,
  useCamera,
} from "../camera";

import {
  RenderRoot,
  RenderLayer,
  SvgRenderer,
} from "../rendering";

/**
 * ============================================================================
 * Historia AI
 * World Map
 * ============================================================================
 */

function WorldMap({
  runtime,
  selectedProvinceId,
  onProvinceClick,
}) {
  const {
    provinces,
  } = useWorldMap(runtime);

  const camera =
    useCamera();

  return (
    <CameraProvider
      value={camera}
    >
      <CameraController
        zoom={camera.zoom}
        move={camera.move}
      />

      <CameraViewport
        camera={camera.camera}
      >
        <RenderRoot>
          <SvgRenderer>
            <RenderLayer>
              <ProvinceLayer
                provinces={provinces}
                selectedProvinceId={
                  selectedProvinceId
                }
                onProvinceClick={
                  onProvinceClick
                }
              />
            </RenderLayer>
          </SvgRenderer>
        </RenderRoot>
      </CameraViewport>
    </CameraProvider>
  );
}

export default WorldMap;