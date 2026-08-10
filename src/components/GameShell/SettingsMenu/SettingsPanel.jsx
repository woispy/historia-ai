import "./SettingsPanel.css";

const TOGGLE_SETTINGS = [
  ["effects", "Efektler"],
  ["smoothCamera", "Yumuşak Kamera"],
  ["mapShadows", "Harita Gölgelendirme"],
  ["notifications", "Bildirimler"],
  ["advisorAutoOpen", "Danışman Panelini Açılışta Göster"],
  ["tips", "Hızlı İpuçlarını Göster"],
];

function SelectRow({ label, value, options, onChange }) {
  return (
    <label className="settings-row settings-select-row">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <label className="settings-row settings-toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
      <span className="settings-switch" aria-hidden="true" />
    </label>
  );
}

function SettingsPanel({ settings, onChange }) {
  return (
    <aside className="settings-panel" aria-label="Ayarlar">
      <div className="settings-panel-header">
        <h2>⚙ Ayarlar</h2>
      </div>

      <div className="settings-panel-body">
        <section>
          <h3>GÖRÜNÜM</h3>
          <SelectRow
            label="Tema"
            value={settings.theme}
            options={[["dark", "Koyu"], ["light", "Açık"]]}
            onChange={(value) => onChange("theme", value)}
          />
          <SelectRow
            label="Harita Stili"
            value={settings.mapStyle}
            options={[["detailed", "Detaylı"], ["political", "Siyasi"], ["terrain", "Arazi"]]}
            onChange={(value) => onChange("mapStyle", value)}
          />
          <SelectRow
            label="Arayüz Ölçeği"
            value={settings.uiScale}
            options={[["90", "%90"], ["100", "%100"], ["110", "%110"]]}
            onChange={(value) => onChange("uiScale", value)}
          />
        </section>

        <section>
          <h3>GRAFİK</h3>
          {TOGGLE_SETTINGS.slice(0, 3).map(([key, label]) => (
            <ToggleRow key={key} label={label} value={settings[key]} onChange={(value) => onChange(key, value)} />
          ))}
        </section>

        <section>
          <h3>ARAYÜZ</h3>
          {TOGGLE_SETTINGS.slice(3).map(([key, label]) => (
            <ToggleRow key={key} label={label} value={settings[key]} onChange={(value) => onChange(key, value)} />
          ))}
        </section>

        <section>
          <h3>DİĞER</h3>
          <SelectRow
            label="Otomatik Kayıt"
            value={settings.autosave}
            options={[["off", "Kapalı"], ["6m", "Her 6 Ayda"], ["1y", "Her Yılda"]]}
            onChange={(value) => onChange("autosave", value)}
          />
          <SelectRow
            label="Dil"
            value={settings.language}
            options={[["tr", "Türkçe"]]}
            onChange={(value) => onChange("language", value)}
          />
        </section>

        <div className="settings-version">v0.1.0 (alpha)<br />© 2026 Historia AI</div>
      </div>
    </aside>
  );
}

export default SettingsPanel;
