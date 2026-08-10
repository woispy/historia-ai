import "./MapView.css";

import { WorldMap } from "../../../map";

function MapView({ gameSession, settings }) {
  return (
    <main
      className="map-view"
      title={settings.tips ? "Haritayı sürükleyerek gezinebilir, tekerlek ile yakınlaşıp uzaklaşabilirsiniz." : undefined}
      aria-label="Dünya haritası"
    >
      <div className="map-layer terrain">
        <WorldMap
          runtime={gameSession}
          settings={settings}
        />
      </div>

      <div className="country-layer" />
      <div className="city-layer" />
      <div className="army-layer" />
      <div className="effect-layer" />
    </main>
  );
}

export default MapView;
