/**
 * Historia AI — historical political map presentation.
 *
 * The renderer must never choose a modern Admin-0 country as the visual owner
 * of a historical province. Historical country records are explicitly tagged
 * at world bootstrap and are the only political colour source accepted here.
 */

import { assertHistoricalPoliticalIdentity } from "../HistoricalMapContract.js";

export const HISTORICAL_NEUTRAL_POLITY = Object.freeze({
  id: "local_polities",
  name: "Local Polities",
  type: "polity",
  timeModel: "historical",
  sourceType: "historical-runtime",
  color: "#6f765f",
  terrainColor: "#6f765f",
});

function normalizeId(value) {
  return String(value ?? "").trim();
}

export function createHistoricalPoliticalPresentation({ polityId = null, country = null } = {}) {
  const id = normalizeId(polityId);
  if (!id || id === "local_polities") return HISTORICAL_NEUTRAL_POLITY;

  if (!country || normalizeId(country.id) !== id) {
    throw new Error(
      `Historical polity ${id} is missing its historical country presentation.`,
    );
  }

  if (country.sourceType !== "historical-runtime" || country.timeModel !== "historical") {
    throw new Error(
      `Modern or untagged country identity cannot render a historical province: ${id}`,
    );
  }

  assertHistoricalPoliticalIdentity({
    id,
    type: "polity",
    sourceType: country.sourceType,
    timeModel: country.timeModel,
  });

  return Object.freeze({
    id,
    name: country.name ?? country.title ?? id,
    type: "polity",
    timeModel: "historical",
    sourceType: "historical-runtime",
    color: country.color ?? HISTORICAL_NEUTRAL_POLITY.color,
    terrainColor: country.terrainColor ?? country.color ?? HISTORICAL_NEUTRAL_POLITY.terrainColor,
  });
}

export function assertHistoricalPoliticalPresentation(presentation = {}) {
  if (presentation.sourceType !== "historical-runtime" || presentation.timeModel !== "historical") {
    throw new Error("Historical political presentation must be historical-runtime data.");
  }
  if (!normalizeId(presentation.id)) {
    throw new Error("Historical political presentation requires a stable polity id.");
  }
  return true;
}
