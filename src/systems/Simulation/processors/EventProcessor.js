import {
  getRuntime,
} from "../../../state";

export function processEvents(
  gameSession
) {
  getRuntime(gameSession);

  return gameSession;
}