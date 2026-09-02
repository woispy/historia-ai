import MapEngineV2 from "../rendering/MapEngineV2.jsx";

function WorldMap({ selectedProvinceId, onProvinceClick, settings = {} }) {
  return (
    <main
      className="map-gpu-viewport"
      title={settings.tips ? "Haritayı sürükleyerek gezinebilir, tekerlek ile yakınlaşıp uzaklaşabilirsiniz." : undefined}
      aria-label="Historia AI GPU dünya haritası"
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    >
      <MapEngineV2
        selectedProvinceId={selectedProvinceId}
        onProvinceClick={onProvinceClick}
      />
    </main>
  );
}

export default WorldMap;
