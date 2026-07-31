import "./ProvincePanel.css";

function ProvincePanel({ viewModel }) {
  if (!viewModel) {
    return (
      <aside className="province-panel">
        <div className="province-panel-empty">
          <h3>📍 İl Seçilmedi</h3>

          <p>
            Haritadan bir il seçerek
            ayrıntılarını görüntüleyebilirsiniz.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="province-panel">
      <div className="province-panel-header">
        <h2>
          📍 {viewModel.displayName}
        </h2>
      </div>

      <div className="province-section">
        <span>Sahibi</span>
        <strong>{viewModel.owner}</strong>
      </div>

      <div className="province-section">
        <span>Kontrol Eden</span>
        <strong>{viewModel.controller}</strong>
      </div>

      <div className="province-section">
        <span>Arazi</span>
        <strong>{viewModel.terrain}</strong>
      </div>

      <div className="province-section">
        <span>Nüfus</span>
        <strong>{viewModel.population}</strong>
      </div>

      <div className="province-section">
        <span>Gelişmişlik</span>
        <strong>{viewModel.development}</strong>
      </div>

      <div className="province-section">
        <span>Vali</span>
        <strong>
          {viewModel.governor ?? "-"}
        </strong>
      </div>

      <div className="province-section">
        <span>Kale</span>
        <strong>{viewModel.fortLevel}</strong>
      </div>

      <div className="province-section">
        <span>Liman</span>
        <strong>
          {viewModel.hasPort
            ? "Var"
            : "Yok"}
        </strong>
      </div>

      <div className="province-section">
        <span>Nehir</span>
        <strong>
          {viewModel.hasRiver
            ? "Var"
            : "Yok"}
        </strong>
      </div>

      <div className="province-section">
        <span>Kültür</span>
        <strong>
          {viewModel.culture ?? "-"}
        </strong>
      </div>

      <div className="province-section">
        <span>Din</span>
        <strong>
          {viewModel.religion ?? "-"}
        </strong>
      </div>
    </aside>
  );
}

export default ProvincePanel;