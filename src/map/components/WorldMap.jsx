import { useMemo } from "react";
import { useWorldMap } from "../hooks";
import { CameraProvider, useCamera } from "../camera";
import MapEngineV2 from "../rendering/MapEngineV2.jsx";

function WorldMap({
  runtime,
  selectedProvinceId,
  onProvinceClick,
  settings = {},
}) {
  const { provinces } = useWorldMap(runtime);
  const camera = useCamera();
  const cameraState = camera.camera;
  const stableProvinces = useMemo(() => provinces, [provinces]);

  return (
    <CameraProvider value={camera}>
      <main
        className="map-gpu-viewport"
        title={settings.tips ? "Haritayı sürükleyerek gezinebilir, tekerlek ile yakınlaşıp uzaklaşabilirsiniz." : undefined}
        aria-label="Historia AI GPU dünya haritası"
        style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
      >
        <MapEngineV2
          provinces={stableProvinces}
          camera={cameraState}
          selectedProvinceId={selectedProvinceId}
          mapStyle={settings.mapStyle ?? "detailed"}
          onProvinceClick={onProvinceClick}
        />
      </main>
    </CameraProvider>
  );
}

export default WorldMap;
