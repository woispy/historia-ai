import {
  getRuntime,
} from "../../../state";

export function processPopulation(
  gameSession
) {
  getRuntime(gameSession);

  return gameSession;
}