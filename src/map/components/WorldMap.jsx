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
 *
 * The world is rendered three times across the antimeridian. The camera wraps
 * horizontally, so dragging past the eastern or western edge continues onto
 * the other side without exposing an empty seam.
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

  const worldCopies = [
    -360,
    0,
    360,
  ];

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
            {worldCopies.map((offset) => (
              <RenderLayer
                key={offset}
                transform={`translate(${offset} 0)`}
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
              </RenderLayer>
            ))}
          </SvgRenderer>
        </RenderRoot>
      </CameraViewport>
    </CameraProvider>
  );
}

export default WorldMap;
