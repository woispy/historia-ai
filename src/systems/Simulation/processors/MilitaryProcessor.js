import {
  getRuntime,
} from "../../../state";

export function processMilitary(
  gameSession
) {
  getRuntime(gameSession);

  return gameSession;
}