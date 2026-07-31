import { getCurrentGame } from "./currentGame";

import { saveGame } from "../save";

import { notifySuccess } from "../notifications/NotificationService";

export function saveCurrentGame() {
  const session = getCurrentGame();

  saveGame(session);

  notifySuccess("Oyun başarıyla kaydedildi.");
}