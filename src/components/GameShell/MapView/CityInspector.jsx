import "./CityInspector.css";

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function booleanLabel(value) {
  return value ? "Var" : "Yok";
}

function CityInspector({ city, country, mapMetadata, onClose }) {
  if (!city) return null;

  const displayName = mapMetadata?.name ?? city.name ?? city.id;
  const historicalSubtitle = mapMetadata?.modernName && mapMetadata.modernName !== displayName
    ? mapMetadata.modernName
    : null;

  return (
    <aside className="city-inspector" aria-label="Şehir bilgileri">
      <div className="city-inspector__header">
        <div>
          <span className="city-inspector__eyebrow">Şehir Bilgisi</span>
          <h2>{displayName}</h2>
          {historicalSubtitle && <span className="city-inspector__subtitle">{historicalSubtitle}</span>}
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
          <dt>Vilayet</dt>
          <dd>{valueOrDash(city.province)}</dd>
        </div>
        <div>
          <dt>Tier</dt>
          <dd>{valueOrDash(mapMetadata?.tier)}</dd>
        </div>
        <div>
          <dt>Liman</dt>
          <dd>{booleanLabel(mapMetadata?.port)}</dd>
        </div>
        <div>
          <dt>Surlu</dt>
          <dd>{booleanLabel(mapMetadata?.fortified)}</dd>
        </div>
        <div>
          <dt>Kuşatma</dt>
          <dd>{booleanLabel(city.status?.underSiege)}</dd>
        </div>
        <div>
          <dt>İşgal</dt>
          <dd>{booleanLabel(city.status?.occupied)}</dd>
        </div>
      </dl>
    </aside>
  );
}

export default CityInspector;
