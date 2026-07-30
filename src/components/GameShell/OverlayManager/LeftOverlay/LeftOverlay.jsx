import "./LeftOverlay.css";

import { TimelineList } from "../../Timeline";
import { PendingActionList } from "../../../PendingActions";
import { PromptInput } from "../../../UI/PromptInput";

function LeftOverlay({
  isOpen,
  activeTab,
  onTabChange,
  timeline = [],
  pendingActions = [],
  editingAction,
  decisionText,
  onDecisionTextChange,
  onSubmitAction,
  onUpdateAction,
  onRemoveAction,
  onCancelEditing,
}) {
  return (
    <aside className={`left-overlay ${isOpen ? "open" : ""}`}>
      <div className="overlay-tabs">
        <button
          className={activeTab === "actions" ? "active" : ""}
          onClick={() => onTabChange("actions")}
        >
          📜 Eylemler
        </button>

        <button
          className={activeTab === "diplomacy" ? "active" : ""}
          onClick={() => onTabChange("diplomacy")}
        >
          🤝 Diplomasi
        </button>
      </div>

      {activeTab === "actions" && (
        <>
          <div className="overlay-content">
            <h3>Son Gelişmeler</h3>

            <TimelineList timeline={timeline} />

            <PendingActionList
              pendingActions={pendingActions}
              onEdit={onUpdateAction}
              onDelete={onRemoveAction}
            />
          </div>

          {editingAction && (
            <div className="editing-actions">
              <strong>✏ Karar Düzenleniyor</strong>

              <button
                type="button"
                onClick={onCancelEditing}
              >
                İptal
              </button>
            </div>
          )}

          <PromptInput
            value={decisionText}
            onChange={onDecisionTextChange}
            onSubmit={onSubmitAction}
            placeholder={
              editingAction
                ? "Kararı düzenleyin..."
                : "Almak istediğiniz kararlar nelerdir?"
            }
            submitLabel={
              editingAction
                ? "Kararı Kaydet"
                : "Karar Ekle"
            }
            submitIcon={
              editingAction
                ? "💾"
                : "➤"
            }
          />
        </>
      )}

      {activeTab === "diplomacy" && (
        <div className="overlay-content">
          <h3>Diplomasi</h3>

          <p>Yakında devletlerle yazışmalar burada yapılacak.</p>

          <PromptInput
            value=""
            onChange={() => {}}
            onSubmit={() => {}}
            placeholder="Devletlere göndermek istediğiniz mesaj..."
          />
        </div>
      )}
    </aside>
  );
}

export default LeftOverlay;