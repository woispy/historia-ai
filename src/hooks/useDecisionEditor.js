import { useState } from "react";

import {
  queueAction,
  updateAction,
  removeAction,
} from "../systems/Action";

export function useDecisionEditor(setGameState) {
  const [editingAction, setEditingAction] = useState(null);
  const [decisionText, setDecisionText] = useState("");

  function submitAction() {
    const text = decisionText.trim();

    if (!text) {
      return;
    }

    setGameState((previousState) => {
      if (editingAction) {
        return updateAction(previousState, editingAction.id, {
          text,
        });
      }

      return queueAction(previousState, text);
    });

    setEditingAction(null);
    setDecisionText("");
  }

  function startEditing(action) {
    setEditingAction(action);
    setDecisionText(action.text);
  }

  function cancelEditing() {
    setEditingAction(null);
    setDecisionText("");
  }

  function deleteAction(actionId) {
    setGameState((previousState) =>
      removeAction(previousState, actionId)
    );

    if (editingAction?.id === actionId) {
      setEditingAction(null);
      setDecisionText("");
    }
  }

  return {
    editingAction,
    decisionText,
    setDecisionText,
    submitAction,
    startEditing,
    cancelEditing,
    deleteAction,
  };
}