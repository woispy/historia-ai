import "./MapView.css";

function MapView() {
  return (
    <main className="map-view">

      {/* Dünya Haritası */}
      <div className="map-layer terrain">

        <div className="map-placeholder">

          <h2>🌍 Dünya Haritası</h2>

          <p>
            Gerçek dünya haritası burada görüntülenecek.
          </p>

        </div>

      </div>

      {/* Ülke Katmanı */}
      <div className="country-layer"></div>

      {/* Şehir Katmanı */}
      <div className="city-layer"></div>

      {/* Ordu Katmanı */}
      <div className="army-layer"></div>

      {/* Efekt Katmanı */}
      <div className="effect-layer"></div>

    </main>
  );
}

export default MapView;