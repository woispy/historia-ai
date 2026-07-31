import { createContext } from "./ContextFactory";

import { ContextTypes } from "./ContextTypes";

import {
  getSelection,
} from "../selection";

import {
  getProvince,
} from "../provinces";

/**
 * ============================================================================
 * Context Builder
 * ============================================================================
 *
 * Converts the current game state into an AI-readable context.
 *
 * AI never reads repositories directly.
 * It only receives this context object.
 */

export function buildContext(world) {
  if (!world) {
    return createContext({
      type: ContextTypes.NONE,

      selection: null,

      subject: null,

      world: null,
    });
  }

  const repositories = world.repositories;

  if (!repositories) {
    return createContext({
      type: ContextTypes.NONE,

      selection: null,

      subject: null,

      world: null,
    });
  }

  const selectionRepository =
    repositories.selection;

  const selection =
    selectionRepository
      ? getSelection(selectionRepository)
      : null;

  const worldContext = {
    currentDate:
      world.currentDate ?? null,

    turn:
      world.turn ?? 0,

    playerCountryId:
      world.playerCountryId ?? null,

    playerCharacterId:
      world.playerCharacterId ?? null,

    season:
      world.season ?? null,
  };

  if (!selection) {
    return createContext({
      type: ContextTypes.NONE,

      selection: null,

      subject: null,

      world: worldContext,
    });
  }

  switch (selection.type) {
    case ContextTypes.PROVINCE: {
      const province = getProvince(
        repositories.provinces,
        selection.id
      );

      if (!province) {
        return createContext({
          type: ContextTypes.NONE,

          selection,

          subject: null,

          world: worldContext,
        });
      }

      return createContext({
        type: ContextTypes.PROVINCE,

        selection,

        subject: province,

        world: worldContext,
      });
    }

    // COUNTRY
    // CHARACTER
    // CITY
    // ARMY

    default:
      return createContext({
        type: ContextTypes.NONE,

        selection,

        subject: null,

        world: worldContext,
      });
  }
}