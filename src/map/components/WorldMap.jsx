import { useWorldMap } from "../hooks";
import { ProvinceLayer } from "./layers";
import { CameraController, CameraProvider, CameraViewport, useCamera } from "../camera";
import { RenderRoot, RenderLayer, SvgRenderer } from "../rendering";

function WorldMap({ runtime, selectedProvinceId, onProvinceClick }) {
  const { provinces } = useWorldMap(runtime);
  const camera = useCamera();
  const worldCopies = [-720, -360, 0, 360, 720];

  return (
    <CameraProvider value={camera}>
      <CameraController zoom={camera.zoom} move={camera.move} />
      <CameraViewport camera={camera.camera}>
        <RenderRoot>
          <SvgRenderer>
            {worldCopies.map((offset) => (
              <g key={offset} transform={`translate(${offset} 0)`}>
                <RenderLayer>
                  <ProvinceLayer
                    provinces={provinces}
                    selectedProvinceId={selectedProvinceId}
                    onProvinceClick={onProvinceClick}
                  />
                </RenderLayer>
              </g>
            ))}
          </SvgRenderer>
        </RenderRoot>
      </CameraViewport>
    </CameraProvider>
  );
}

export default WorldMap;
