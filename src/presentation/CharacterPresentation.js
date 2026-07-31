/**
 * ============================================================================
 * Historia AI
 * Character Presentation
 * ============================================================================
 *
 * Converts Character data into player-facing text.
 *
 * This layer NEVER changes gameplay.
 * It only formats information.
 */

import { getTitleName } from "./TitlePresentation";

export function getCharacterDisplayName(character) {
  if (!character) {
    return "";
  }

  const title = getTitleName(character);

  if (!title) {
    return character.firstName;
  }

  return `${character.firstName} ${title}`;
}

export function getCharacterFormalName(character) {
  if (!character) {
    return "";
  }

  const title = getTitleName(character);

  if (!title) {
    return character.firstName;
  }

  return `${title} ${character.firstName}`;
}

export function getCharacterShortName(character) {
  return character?.firstName ?? "";
}