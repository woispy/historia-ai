export function resolveIntent(text = "") {
  const value = text.toLowerCase();

  if (
    value.includes("kuşat") ||
    value.includes("kuşatılsın")
  ) {
    return "military.siege";
  }

  if (
    value.includes("saldır") ||
    value.includes("hücum")
  ) {
    return "military.attack";
  }

  if (
    value.includes("vergi")
  ) {
    return "economy.tax";
  }

  if (
    value.includes("elçi")
  ) {
    return "diplomacy.sendEnvoy";
  }

  if (
    value.includes("inşa") ||
    value.includes("kur")
  ) {
    return "construction.build";
  }

  return "player.command";
}