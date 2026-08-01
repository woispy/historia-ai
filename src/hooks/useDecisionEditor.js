import { useState } from "react";

import {
  queueAction,
  updateAction,
  removeAction,
} from "../systems/Action";

import {
  updateCurrentGame,
} from "../game/currentGame";

export function useDecisionEditor(
  setGameSession
) {
  const [
    editingAction,
    setEditingAction,
  ] = useState(null);

  const [
    decisionText,
    setDecisionText,
  ] = useState("");

  function submitAction() {
    const text =
      decisionText.trim();

    if (!text) {
      return;
    }

    setGameSession(
      (previousSession) => {
        let nextSession;

        if (editingAction) {
          nextSession =
            updateAction(
              previousSession,
              editingAction.id,
              {
                text,
              }
            );
        } else {
          nextSession =
            queueAction(
              previousSession,
              text
            );
        }

        updateCurrentGame(
          nextSession
        );

        return nextSession;
      }
    );

    setEditingAction(null);

    setDecisionText("");
  }

  function startEditing(
    action
  ) {
    setEditingAction(action);

    setDecisionText(
      action.text
    );
  }

  function cancelEditing() {
    setEditingAction(null);

    setDecisionText("");
  }

  function deleteAction(
    actionId
  ) {
    setGameSession(
      (previousSession) => {
        const nextSession =
          removeAction(
            previousSession,
            actionId
          );

        updateCurrentGame(
          nextSession
        );

        return nextSession;
      }
    );

    if (
      editingAction?.id ===
      actionId
    ) {
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