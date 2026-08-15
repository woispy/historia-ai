import "./MapView.css";

import { WorldMap } from "../../../map";

function MapView({ gameSession, settings }) {
  return (
    <main
      className="map-view"
      title={settings.tips ? "Haritayı sürükleyerek gezinebilir, tekerlek ile yakınlaşıp uzaklaşabilirsiniz." : undefined}
      aria-label="Dünya haritası"
    >
      <WorldMap
        runtime={gameSession}
        settings={settings}
      />
    </main>
  );
}

export default MapView;
