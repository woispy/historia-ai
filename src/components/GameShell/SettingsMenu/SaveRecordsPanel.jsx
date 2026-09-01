import { useState } from "react";
import "./SettingsMenu.css";

import { deleteGameSlot, listSaveSlots, loadGameFromSlot, saveGameToSlot } from "../../../save";
import { getCurrentGame } from "../../../game/currentGame";

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatGameDate(date) {
  if (!date) return "—";
  if (typeof date === "string") return date;
  const day = String(date.day ?? "").padStart(2, "0");
  const month = String(date.month ?? "").padStart(2, "0");
  return `${day}.${month}.${date.year ?? "—"}`;
}

function SaveRecordCard({ record, onLoad, onDelete }) {
  return (
    <div className="save-record-card has-save">
      <strong>{record.label}</strong>
      <span>{record.characterName} · {record.countryId ?? "—"}</span>
      <small>Oyun tarihi: {formatGameDate(record.gameDate)}</small>
      <small>Son oynama: {formatTimestamp(record.lastPlayed)}</small>
      <div>
        <button type="button" onClick={() => onLoad(record.slotId)}>Yükle</button>
        <button type="button" onClick={() => onDelete(record.slotId)}>Sil</button>
      </div>
    </div>
  );
}

function SaveRecordsPanel({ onBack, onDelete, onLoad, allowSave = true }) {
  const [records, setRecords] = useState(() => listSaveSlots());
  const [selectedSlot, setSelectedSlot] = useState("1");
  const [error, setError] = useState("");

  function refresh() { setRecords(listSaveSlots()); }

  function saveToSelectedSlot() {
    setError("");
    try {
      const info = saveGameToSlot(getCurrentGame(), selectedSlot);
      setSelectedSlot(info.slotId);
      refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kayıt alınamadı.");
    }
  }

  function loadSlot(slotId) {
    setError("");
    try {
      const session = loadGameFromSlot(slotId);
      if (!session) throw new Error("Kayıt bulunamadı.");
      onLoad?.(session);
      if (onBack) onBack();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kayıt yüklenemedi.");
    }
  }

  function removeSlot(slotId) {
    deleteGameSlot(slotId);
    onDelete?.(slotId);
    refresh();
  }

  const recordBySlot = new Map(records.map((record) => [record.slotId, record]));
  const manualSlots = Array.from({ length: 8 }, (_, index) => String(index + 1));

  return (
    <div className="save-records-panel">
      <div className="settings-subheader">
        {onBack && <button type="button" className="settings-back-button" onClick={onBack}>←</button>}
        <h2>Kayıtlar</h2>
      </div>
      <div className="save-records-body">
        {allowSave && (
          <div className="save-slot-create">
            <label htmlFor="save-slot-select">Kayıt yuvası</label>
            <select id="save-slot-select" value={selectedSlot} onChange={(event) => setSelectedSlot(event.target.value)}>
              {manualSlots.map((slot) => <option key={slot} value={slot}>Kayıt {slot}</option>)}
            </select>
            <button type="button" onClick={saveToSelectedSlot}>Bu Yuvaya Kaydet</button>
          </div>
        )}
        {recordBySlot.has("autosave") && <SaveRecordCard record={recordBySlot.get("autosave")} onLoad={loadSlot} onDelete={removeSlot} />}
        {manualSlots.map((slotId) => (
          recordBySlot.has(slotId)
            ? <SaveRecordCard key={slotId} record={recordBySlot.get(slotId)} onLoad={loadSlot} onDelete={removeSlot} />
            : <div className="save-record-card" key={slotId}><strong>Kayıt {slotId}</strong><span>Boş kayıt yuvası</span></div>
        ))}
        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  );
}

export default SaveRecordsPanel;
