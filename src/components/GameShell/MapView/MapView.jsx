import "./MapView.css";

import { WorldMap } from "../../../map";

function MapView({ gameSession, settings }) {
  return (
    <main className="map-view">
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
