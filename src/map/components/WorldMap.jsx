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

  const {
    camera,
    zoom,
    move,
  } = useCamera();

  return (
    <CameraProvider>
      <CameraController
        zoom={zoom}
        move={move}
      />

      <CameraViewport
        camera={camera}
      >
        <ProvinceLayer
          provinces={provinces}
          selectedProvinceId={
            selectedProvinceId
          }
          onProvinceClick={
            onProvinceClick
          }
        />
      </CameraViewport>
    </CameraProvider>
  );
}

export default WorldMap;