/**
 * ============================================================================
 * Historia AI
 * Authority Registry
 * ============================================================================
 *
 * Defines every authority level that can exist in the game.
 *
 * Authority is NOT a profession.
 * Authority represents what a character is legally allowed to do.
 */

export const AuthorityRegistry = Object.freeze({
  RULER: {
    id: "RULER",
    name: "Ruler",

    permissions: [
      "diplomacy",
      "laws",
      "taxation",
      "army",
      "appointments",
      "titles",
      "execution",
      "marriage",
    ],
  },

  HEIR: {
    id: "HEIR",
    name: "Heir",

    permissions: [
      "marriage",
      "titles",
    ],
  },

  GOVERNOR: {
    id: "GOVERNOR",
    name: "Governor",

    permissions: [
      "local_army",
      "local_taxation",
    ],
  },

  GENERAL: {
    id: "GENERAL",
    name: "General",

    permissions: [
      "army",
    ],
  },

  DIPLOMAT: {
    id: "DIPLOMAT",
    name: "Diplomat",

    permissions: [
      "diplomacy",
    ],
  },

  SPYMASTER: {
    id: "SPYMASTER",
    name: "Spymaster",

    permissions: [
      "espionage",
    ],
  },

  RELIGIOUS_LEADER: {
    id: "RELIGIOUS_LEADER",
    name: "Religious Leader",

    permissions: [
      "religion",
    ],
  },

  NOBLE: {
    id: "NOBLE",
    name: "Noble",

    permissions: [],
  },

  COMMONER: {
    id: "COMMONER",
    name: "Commoner",

    permissions: [],
  },
});