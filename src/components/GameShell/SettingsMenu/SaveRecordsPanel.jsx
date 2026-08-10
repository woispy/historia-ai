import { useState } from "react";

import { getGameSaveInfo, hasGameSave } from "../../../save";

function formatTimestamp(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SaveRecordsPanel({ onBack, onDelete }) {
  const [hasSave, setHasSave] = useState(() => hasGameSave());
  const [info, setInfo] = useState(() => getGameSaveInfo());

  function refresh() {
    setHasSave(hasGameSave());
    setInfo(getGameSaveInfo());
  }

  function handleDelete() {
    if (!hasSave) return;
    onDelete?.();
    refresh();
  }

  return (
    <div className="save-records-panel">
      <div className="settings-subheader">
        <button type="button" className="settings-back-button" onClick={onBack}>
          ←
        </button>
        <h2>Kayıtlar</h2>
      </div>

      <div className="save-records-body">
        <div className={`save-record-card${hasSave ? " has-save" : ""}`}>
          <strong>Ana Kayıt</strong>
          <span>{hasSave ? "Kayıt mevcut" : "Kayıt bulunamadı"}</span>
          {info && (
            <small>
              Son oynama: {formatTimestamp(info.lastPlayed)}
            </small>
          )}
        </div>

        <button
          type="button"
          className="save-record-delete"
          disabled={!hasSave}
          onClick={handleDelete}
        >
          Kaydı Sil
        </button>
      </div>
    </div>
  );
}

export default SaveRecordsPanel;
