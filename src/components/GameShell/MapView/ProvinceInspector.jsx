import "./ProvinceInspector.css";

import { createProvincePanelViewModel } from "../../../provinces/presentation/ProvincePanelViewModel.js";

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function booleanLabel(value) {
  if (value === true) return "Var";
  if (value === false) return "Yok";
  return "—";
}

function historicalStatusLabel(value) {
  const labels = {
    established: "Yerleşik kontrol",
    "established-emirate": "Yerleşik beylik",
    "established-frontier": "Yerleşik sınır",
    frontier: "Sınır bölgesi",
    "contested-frontier": "Çekişmeli sınır",
    "contested-coast": "Çekişmeli kıyı",
    "frontier-emirate": "Sınır emirliği",
    "frontier-conquest": "Fetih sınırı",
    "emerging-emirate": "Yükselen beylik",
    "emerging-independent": "Bağımsızlaşan beylik",
    "Hamidid-emerging": "Hamidid oluşum dönemi",
    "Menteshe-influence": "Menteşe nüfuzu",
    "Pervaneoğulları-sphere": "Pervâneoğulları nüfuzu",
    "Candarid-emerging": "Candarid oluşumu",
    "legacy-frontier": "Tarihsel sınır mirası",
    "Ilkhanid-suzerainty": "İlhanlı üst egemenliği",
    "pre-Aydinid": "Aydınoğulları öncesi",
  };
  return labels[value] ?? valueOrDash(value);
}

function historicalConfidenceLabel(value) {
  const labels = {
    high: "Yüksek",
    medium: "Orta",
    low: "Düşük",
  };
  return labels[value] ?? valueOrDash(value);
}

function ProvinceInspector({ province, country, onClose }) {
  const viewModel = createProvincePanelViewModel(province);
  if (!viewModel) return null;

  const historical = province?.historicalControl
    ?? province?.historical?.historicalControl
    ?? null;
  const region = province?.historical?.partOf
    ?? province?.regionId
    ?? null;
  const controller = province?.controller ?? historical?.controllerAt1300 ?? null;
  const coastal = province?.coastal ?? province?.geometry?.coastal;
  const port = province?.port ?? province?.geometry?.port;
  const strategic = province?.strategic ?? province?.geometry?.strategic;

  return (
    <aside className="province-inspector" aria-label="Bölge bilgileri">
      <div className="province-inspector__header">
        <div>
          <span className="province-inspector__eyebrow">Bölge Bilgisi</span>
          <h2>{viewModel.displayName}</h2>
        </div>
        <button
          type="button"
          className="province-inspector__close"
          aria-label="Bölge panelini kapat"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="province-inspector__owner">
        <span>Sahip</span>
        <strong>{valueOrDash(country?.name ?? country?.displayName ?? viewModel.owner)}</strong>
      </div>

      <dl className="province-inspector__grid">
        <div><dt>Nüfus</dt><dd>{valueOrDash(viewModel.population)}</dd></div>
        <div><dt>Gelişim</dt><dd>{valueOrDash(viewModel.development)}</dd></div>
        <div><dt>Arazi</dt><dd>{valueOrDash(viewModel.terrain)}</dd></div>
        <div><dt>Vali</dt><dd>{valueOrDash(viewModel.governor)}</dd></div>
        <div><dt>Kale Seviyesi</dt><dd>{valueOrDash(viewModel.fortLevel)}</dd></div>
        <div><dt>Liman</dt><dd>{booleanLabel(port ?? viewModel.hasPort)}</dd></div>
        <div><dt>Nehir</dt><dd>{booleanLabel(viewModel.hasRiver)}</dd></div>
        <div><dt>Kıyı</dt><dd>{booleanLabel(coastal)}</dd></div>
        <div><dt>Kültür</dt><dd>{valueOrDash(viewModel.culture)}</dd></div>
        <div><dt>Din</dt><dd>{valueOrDash(viewModel.religion)}</dd></div>
        <div><dt>Stratejik</dt><dd>{booleanLabel(strategic)}</dd></div>
        <div><dt>Kontrol</dt><dd>{valueOrDash(controller)}</dd></div>
        <div><dt>1300 Durumu</dt><dd>{historicalStatusLabel(historical?.statusAt1300)}</dd></div>
        <div><dt>Tarihsel Güven</dt><dd>{historicalConfidenceLabel(historical?.confidence)}</dd></div>
        <div><dt>Tarihsel Bölge</dt><dd>{valueOrDash(region)}</dd></div>
        <div><dt>Başlangıç</dt><dd>{valueOrDash(historical?.startYear)}</dd></div>
      </dl>

      {historical?.note && (
        <p className="province-inspector__note">{historical.note}</p>
      )}
    </aside>
  );
}

export default ProvinceInspector;
