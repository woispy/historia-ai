import "./PendingActionList.css";

import PendingActionEntry from "../PendingActionEntry";

function PendingActionList({
  pendingActions = [],
  onEdit,
  onDelete,
}) {
  return (
    <div className="pending-actions">
      <h3>Bekleyen Kararlar</h3>

      {pendingActions.length === 0 ? (
        <p>Bekleyen karar yok.</p>
      ) : (
        <ul className="pending-action-list">
          {pendingActions.map((action) => (
            <PendingActionEntry
              key={action.id}
              action={action}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default PendingActionList;