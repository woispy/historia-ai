import {
  getRuntime,
} from "../../../state";

export function processDiplomacy(
  gameSession
) {
  getRuntime(gameSession);

  return gameSession;
}