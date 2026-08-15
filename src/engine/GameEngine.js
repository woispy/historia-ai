/**
 * ============================================================================
 * Historia AI
 * Game Engine
 * ============================================================================
 *
 * The Game Engine is the single public command surface for gameplay runtime
 * mutations. It orchestrates Turn -> Simulation and delegates player action
 * editing to the Action system.
 *
 * The engine is intentionally stateless: GameSession remains the source of
 * truth and every command returns a new session.
 */

import {
  queueAction,
  updateAction,
  removeAction,
} from "../systems/Action";
import { processTurn } from "../systems/Turn";

const TURN_UNITS = new Set([
  "day",
  "week",
  "month",
  "year",
]);

function assertSession(gameSession) {
  if (!gameSession) {
    throw new Error("GameSession is required.");
  }

  if (!gameSession.state) {
    throw new Error("GameSession state is required.");
  }
}

function normalizeAmount(amount) {
  const normalized = Number(amount);

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error("Turn amount must be a positive integer.");
  }

  return normalized;
}

function normalizeUnit(unit) {
  if (!TURN_UNITS.has(unit)) {
    throw new Error(
      `Unsupported turn unit: ${String(unit)}. Expected day, week, month or year.`
    );
  }

  return unit;
}

/**
 * Advance the simulation through the canonical runtime pipeline.
 */
export function advanceGame(gameSession, unit = "week", amount = 1) {
  assertSession(gameSession);

  const normalizedUnit = normalizeUnit(unit);
  const normalizedAmount = normalizeAmount(amount);
  const nextSession = processTurn(
    gameSession,
    normalizedUnit,
    normalizedAmount
  );

  return {
    ...nextSession,
    statistics: {
      ...(nextSession.statistics ?? {}),
      totalTurns: (nextSession.statistics?.totalTurns ?? 0) + 1,
    },
  };
}

export function queuePlayerAction(gameSession, actionText) {
  assertSession(gameSession);
  return queueAction(gameSession, actionText);
}

export function updatePlayerAction(gameSession, actionId, changes) {
  assertSession(gameSession);
  return updateAction(gameSession, actionId, changes);
}

export function removePlayerAction(gameSession, actionId) {
  assertSession(gameSession);
  return removeAction(gameSession, actionId);
}

export const GameEngine = Object.freeze({
  advance: advanceGame,
  queueAction: queuePlayerAction,
  updateAction: updatePlayerAction,
  removeAction: removePlayerAction,
});
