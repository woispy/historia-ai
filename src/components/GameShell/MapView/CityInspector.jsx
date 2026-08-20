import "./CityInspector.css";

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function CityInspector({ city, country, province, mapMetadata, onClose }) {
  if (!city) return null;

  const underSiege = Boolean(city.status?.underSiege);
  const buildingCount = Array.isArray(city.buildings) ? city.buildings.length : 0;
  const garrisonCount = Array.isArray(city.garrison) ? city.garrison.length : 0;

  return (
    <aside className="city-inspector" aria-label="Şehir bilgileri">
      <div className="city-inspector__header">
        <div>
          <span className="city-inspector__eyebrow">Şehir Bilgisi</span>
          <h2>{valueOrDash(city.name ?? mapMetadata?.name)}</h2>
        </div>
        <button
          type="button"
          className="city-inspector__close"
          aria-label="Şehir panelini kapat"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="city-inspector__owner">
        <span>Sahip</span>
        <strong>{valueOrDash(country?.name ?? country?.displayName ?? city.owner)}</strong>
      </div>

      <dl className="city-inspector__grid">
        <div>
          <dt>Eyalet</dt>
          <dd>{valueOrDash(province?.name ?? province?.displayName ?? city.province)}</dd>
        </div>
        <div>
          <dt>Nüfus</dt>
          <dd>{valueOrDash(city.population)}</dd>
        </div>
        <div>
          <dt>Refah</dt>
          <dd>{valueOrDash(city.prosperity)}</dd>
        </div>
        <div>
          <dt>Gıda</dt>
          <dd>{valueOrDash(city.food)}</dd>
        </div>
        <div>
          <dt>Sadakat</dt>
          <dd>{valueOrDash(city.loyalty)}</dd>
        </div>
        <div>
          <dt>Kuşatma</dt>
          <dd>{underSiege ? "Var" : "Yok"}</dd>
        </div>
        <div>
          <dt>Binalar</dt>
          <dd>{buildingCount}</dd>
        </div>
        <div>
          <dt>Garnizon</dt>
          <dd>{garrisonCount}</dd>
        </div>
        <div>
          <dt>Liman</dt>
          <dd>{mapMetadata?.port ? "Var" : "Yok"}</dd>
        </div>
      </dl>
    </aside>
  );
}

export default CityInspector;
