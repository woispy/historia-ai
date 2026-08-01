import {
  getRuntime,
} from "../../../state";

export function processEconomy(
  gameSession
) {
  getRuntime(gameSession);

  return gameSession;
}