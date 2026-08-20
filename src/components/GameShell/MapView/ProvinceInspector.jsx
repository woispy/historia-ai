import "./ProvinceInspector.css";

import { createProvincePanelViewModel } from "../../../provinces/presentation/ProvincePanelViewModel.js";

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function booleanLabel(value) {
  return value ? "Var" : "Yok";
}

function ProvinceInspector({ province, country, onClose }) {
  const viewModel = createProvincePanelViewModel(province);

  if (!viewModel) return null;

  return (
    <aside className="province-inspector" aria-label="Eyalet bilgileri">
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
          ×
        </button>
      </div>

      <div className="province-inspector__owner">
        <span>Sahip</span>
        <strong>{valueOrDash(country?.name ?? country?.displayName ?? viewModel.owner)}</strong>
      </div>

      <dl className="province-inspector__grid">
        <div>
          <dt>Nüfus</dt>
          <dd>{valueOrDash(viewModel.population)}</dd>
        </div>
        <div>
          <dt>Gelişim</dt>
          <dd>{valueOrDash(viewModel.development)}</dd>
        </div>
        <div>
          <dt>Arazi</dt>
          <dd>{valueOrDash(viewModel.terrain)}</dd>
        </div>
        <div>
          <dt>Vali</dt>
          <dd>{valueOrDash(viewModel.governor)}</dd>
        </div>
        <div>
          <dt>Kale Seviyesi</dt>
          <dd>{valueOrDash(viewModel.fortLevel)}</dd>
        </div>
        <div>
          <dt>Liman</dt>
          <dd>{booleanLabel(viewModel.hasPort)}</dd>
        </div>
        <div>
          <dt>Nehir</dt>
          <dd>{booleanLabel(viewModel.hasRiver)}</dd>
        </div>
        <div>
          <dt>Kültür</dt>
          <dd>{valueOrDash(viewModel.culture)}</dd>
        </div>
        <div>
          <dt>Din</dt>
          <dd>{valueOrDash(viewModel.religion)}</dd>
        </div>
      </dl>
    </aside>
  );
}

export default ProvinceInspector;
