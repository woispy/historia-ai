export function getHistoricalPoliticalOverlayMode(entry) {
  const status = String(entry?.historicalProvince?.controlStatus ?? "").trim().toLowerCase();

  if (
    status === "ilkhanid-suzerainty"
    || status.includes("suzerainty")
    || status.includes("vassal")
  ) return "suzerainty";
  if (status.includes("contested") || status.includes("frontier")) return "contested";
  if (!entry?.historicalPolitical?.id || entry.historicalPolitical.id === "local_polities") {
    return "neutral";
  }

  return "sovereign";
}
