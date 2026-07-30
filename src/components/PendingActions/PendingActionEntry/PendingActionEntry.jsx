import "./PendingActionEntry.css";

function PendingActionEntry({
  action,
  onEdit,
  onDelete,
}) {
  return (
    <li className="pending-action-entry">
      <div className="pending-action-content">
        <div className="pending-action-main">
          <span className="pending-action-icon">⏳</span>

          <span className="pending-action-text">
            {action.text}
          </span>
        </div>

        <div className="pending-action-actions">
          <button
            type="button"
            className="pending-action-button"
            onClick={() => onEdit?.(action)}
          >
            ✏ Düzenle
          </button>

          <button
            type="button"
            className="pending-action-button danger"
            onClick={() => onDelete?.(action.id)}
          >
            🗑 Sil
          </button>
        </div>
      </div>
    </li>
  );
}

export default PendingActionEntry;