import { CameraProvider, useCamera } from "../camera";
import MapEngineV2 from "../rendering/MapEngineV2.jsx";

function WorldMap({ selectedProvinceId, onProvinceClick, settings = {} }) {
  const camera = useCamera();
  const cameraState = camera.camera;

  return (
    <CameraProvider value={camera}>
      <main
        className="map-gpu-viewport"
        title={settings.tips ? "Haritayı sürükleyerek gezinebilir, tekerlek ile yakınlaşıp uzaklaşabilirsiniz." : undefined}
        aria-label="Historia AI GPU dünya haritası"
        style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
      >
        <MapEngineV2
          camera={cameraState}
          selectedProvinceId={selectedProvinceId}
          onProvinceClick={onProvinceClick}
        />
      </main>
    </CameraProvider>
  );
}

export default WorldMap;
