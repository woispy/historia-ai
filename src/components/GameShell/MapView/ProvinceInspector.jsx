import "./ProvinceInspector.css";

import { createProvincePanelViewModel } from "../../../provinces/presentation/ProvincePanelViewModel.js";
import { getHistoricalPolity } from "../../../world/map/historical/HistoricalPoliticalRuntime.js";

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function booleanLabel(value) {
  if (value === true) return "Var";
  if (value === false) return "Yok";
  return "—";
}

function riverLabel(hasRiver, riverName) {
  if (hasRiver !== true) return hasRiver === false ? "Yok" : "—";
  return riverName ? `Var — ${riverName}` : "Var";
}

function lakeLabel(hasLake, lakeName) {
  if (hasLake !== true) return hasLake === false ? "Yok" : "—";
  return lakeName ? `Var — ${lakeName}` : "Var";
}

function featureLabel(name) {
  return name ? `Var — ${name}` : "—";
}

function historicalStatusLabel(value) {
  const labels = {
    established: "Yerleşik kontrol",
    "established-emirate": "Yerleşik beylik",
    "established-frontier": "Yerleşik sınır",
    "established-kingdom": "Yerleşik krallık",
    "established-empire": "Yerleşik imparatorluk",
    "established-local-emirate": "Yerleşik yerel emirlik",
    frontier: "Sınır bölgesi",
    "contested-frontier": "Çekişmeli sınır",
    "contested-coast": "Çekişmeli kıyı",
    "contested-southern-frontier": "Çekişmeli güney sınırı",
    "frontier-emirate": "Sınır emirliği",
    "frontier-conquest": "Fetih sınırı",
    "emerging-emirate": "Yükselen beylik",
    "emerging-independent": "Bağımsızlaşan beylik",
    "Hamidid-emerging": "Hamidid oluşum dönemi",
    "Menteshe-influence": "Menteşe nüfuzu",
    "Pervaneoğulları-sphere": "Pervâneoğulları nüfuzu",
    "Candarid-emerging": "Candarid oluşumu",
    "legacy-frontier": "Tarihsel sınır mirası",
    "contested-legacy": "Çekişmeli tarihsel miras",
    "Ilkhanid-suzerainty": "İlhanlı üst egemenliği",
    overlordship: "Üst egemenlik",
    "pre-Aydinid": "Aydınoğulları öncesi",
  };
  return labels[value] ?? valueOrDash(value);
}

function historicalConfidenceLabel(value) {
  const labels = { high: "Yüksek", medium: "Orta", low: "Düşük" };
  return labels[value] ?? valueOrDash(value);
}

function terrainLabel(value) {
  const labels = {
    coast: "Kıyı",
    lowland: "Ova",
    plains: "Ova",
    valley: "Vadi",
    "river-valley": "Nehir vadisi",
    highland: "Yüksek arazi",
    mountain: "Dağlık",
    plateau: "Plato",
    lake: "Göl havzası",
  };
  return labels[value] ?? valueOrDash(value);
}

function historicalRegionLabel(value) {
  const labels = {
    bithynia: "Bitinya",
    "ottoman-frontier": "Sangarios Sınırı",
    mysia: "Mysia",
    "aegean-west": "Lidya ve İyonya",
    "mentese-caria": "Karia / Menteşe",
    "inner-west": "İç Batı Anadolu",
    "central-anatolia": "İç Anadolu",
    pontus: "Pontos",
    "eastern-anatolia": "Doğu Anadolu",
    cilicia: "Kilikya ve Toroslar",
  };
  return labels[value] ?? valueOrDash(value);
}

function polityLabel(id, polity) {
  if (!id) return "—";
  return polity?.name ?? getHistoricalPolity(id)?.name ?? id;
}

function historicalNoteLabel(note, displayName, controller, historicalPolity, confidence) {
  if (!note) return null;
  const translations = new Map([
    [
      "Kütahya is the strongest geographic anchor for Yakub Bey's independent phase.",
      "Kütahya, Yakub Bey'in bağımsızlık döneminin en güçlü coğrafi dayanağıdır.",
    ],
  ]);
  const translated = translations.get(note);
  if (translated) return translated;

  const owner = polityLabel(controller, historicalPolity);
  const confidenceText = historicalConfidenceLabel(confidence).toLocaleLowerCase("tr-TR");
  if (owner !== "—") {
    return `${displayName}, 1300 başlangıç çerçevesinde ${owner} kontrolünde değerlendirilir. Tarihsel güven düzeyi ${confidenceText}tir.`;
  }
  return `${displayName}, 1300 başlangıç çerçevesinde çekişmeli veya katmanlı bir alan olarak değerlendirilir. Tarihsel güven düzeyi ${confidenceText}tir.`;
}

function ProvinceInspector({ province, country, historicalMetadata = null, historicalPolity = null, onClose }) {
  const viewModel = createProvincePanelViewModel(province);
  if (!viewModel) return null;

  const historical = historicalMetadata?.historicalControl
    ?? province?.historicalControl
    ?? province?.historical?.historicalControl
    ?? null;
  const controller = historical?.controllerAt1300 ?? province?.controller ?? null;
  const coastal = historicalMetadata?.coastal ?? province?.coastal ?? null;
  const port = historicalMetadata?.port ?? province?.port ?? viewModel.hasPort;
  const strategic = historicalMetadata?.strategic ?? province?.strategic ?? null;
  const terrain = historicalMetadata?.terrain ?? province?.terrain ?? viewModel.terrain;
  const hasRiver = province?.river ?? viewModel.hasRiver;
  const riverName = province?.riverName ?? null;
  const riverDetail = province?.riverDetail ?? null;
  const hasLake = province?.lake ?? null;
  const lakeName = province?.lakeName ?? null;
  const lakeDetail = province?.lakeDetail ?? null;
  const mountainsName = province?.mountainsName ?? null;
  const mountainsDetail = province?.mountainsDetail ?? null;
  const passesName = province?.passesName ?? null;
  const passesDetail = province?.passesDetail ?? null;
  const naturalBoundarySummary = province?.naturalBoundarySummary ?? null;
  const naturalBoundaryFeatures = province?.naturalBoundaryFeatures ?? [];
  const displayOwner = historicalMetadata
    ? polityLabel(controller, historicalPolity)
    : (country?.name ?? country?.displayName ?? viewModel.owner);
  const historicalNote = historicalNoteLabel(
    historical?.note,
    viewModel.displayName,
    controller,
    historicalPolity,
    historical?.confidence,
  );

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
        <strong>{displayOwner}</strong>
      </div>

      <dl className="province-inspector__grid">
        <div><dt>Nüfus</dt><dd>{valueOrDash(viewModel.population)}</dd></div>
        <div><dt>Gelişim</dt><dd>{valueOrDash(viewModel.development)}</dd></div>
        <div><dt>Arazi</dt><dd>{terrainLabel(terrain)}</dd></div>
        <div><dt>Dağlar</dt><dd>{featureLabel(mountainsName)}</dd></div>
        <div><dt>Geçitler</dt><dd>{featureLabel(passesName)}</dd></div>
        <div><dt>Vali</dt><dd>{valueOrDash(viewModel.governor)}</dd></div>
        <div><dt>Kale Seviyesi</dt><dd>{valueOrDash(viewModel.fortLevel)}</dd></div>
        <div><dt>Liman</dt><dd>{booleanLabel(port)}</dd></div>
        <div><dt>Nehir</dt><dd>{riverLabel(hasRiver, riverName)}</dd></div>
        <div><dt>Göl</dt><dd>{lakeLabel(hasLake, lakeName)}</dd></div>
        <div><dt>Kıyı</dt><dd>{booleanLabel(coastal)}</dd></div>
        <div><dt>Kültür</dt><dd>{valueOrDash(viewModel.culture)}</dd></div>
        <div><dt>Din</dt><dd>{valueOrDash(viewModel.religion)}</dd></div>
        <div><dt>Stratejik</dt><dd>{booleanLabel(strategic)}</dd></div>
        {historicalMetadata && (
          <>
            <div><dt>1300 Kontrolü</dt><dd>{polityLabel(controller, historicalPolity)}</dd></div>
            <div><dt>1300 Durumu</dt><dd>{historicalStatusLabel(historical?.statusAt1300)}</dd></div>
            <div><dt>Tarihsel Güven</dt><dd>{historicalConfidenceLabel(historical?.confidence)}</dd></div>
            <div><dt>Tarihsel Bölge</dt><dd>{historicalRegionLabel(historicalMetadata.regionId)}</dd></div>
            <div><dt>Başlangıç</dt><dd>{valueOrDash(historical?.startYear)}</dd></div>
            {naturalBoundarySummary && <div><dt>Doğal Sınır</dt><dd>{naturalBoundarySummary}</dd></div>}
          </>
        )}
      </dl>

      {naturalBoundaryFeatures.length > 0 && (
        <p className="province-inspector__note">
          <strong>Doğal referanslar:</strong> {naturalBoundaryFeatures.join(" · ")}.
        </p>
      )}
      {mountainsDetail && <p className="province-inspector__note">{mountainsName}: {mountainsDetail}.</p>}
      {passesDetail && <p className="province-inspector__note">{passesName}: {passesDetail}.</p>}
      {riverDetail && <p className="province-inspector__note">{riverName}: {riverDetail}.</p>}
      {lakeDetail && <p className="province-inspector__note">{lakeName}: {lakeDetail}.</p>}
      {historicalNote && <p className="province-inspector__note">{historicalNote}</p>}
    </aside>
  );
}

export default ProvinceInspector;
