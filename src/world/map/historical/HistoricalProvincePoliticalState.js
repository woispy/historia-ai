/**
 * Historia AI — dated province political state.
 *
 * A province has persistent geography, but its political state is time-bound.
 * Sovereignty/control and suzerainty are intentionally represented separately
 * so a neutral or layered 1300 province is not painted as a direct polity.
 */

const SUZERAINTY_BY_STATUS = Object.freeze({
  "Ilkhanid-suzerainty": "ilkhanate",
});

function normalizeDate(date) {
  const value = String(date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Historical province state requires an ISO date: ${date ?? "<missing>"}`);
  }
  return value;
}

function deriveControlMode(province) {
  if (province.polityId) {
    return province.controlStatus?.includes("contested") ? "contested-sovereignty" : "sovereign-control";
  }

  if (province.controlStatus?.toLowerCase().includes("suzerainty")) {
    return "layered-suzerainty";
  }

  if (province.controlStatus?.toLowerCase().includes("frontier")) {
    return "contested-frontier";
  }

  return "unassigned-historical-control";
}

export function createHistoricalProvincePoliticalState({ date, province } = {}) {
  const normalizedDate = normalizeDate(date);
  if (!province || province.type !== "province") {
    throw new TypeError("province must be a historical province record.");
  }

  const sovereignPolityId = province.polityId ?? null;
  const suzeraintyPolityId = sovereignPolityId
    ? null
    : SUZERAINTY_BY_STATUS[province.controlStatus] ?? null;

  return Object.freeze({
    date: normalizedDate,
    provinceId: province.id,
    type: "province-political-state",
    timeModel: "historical",
    sourceType: "historical-runtime",
    sovereignPolityId,
    suzeraintyPolityId,
    controlMode: deriveControlMode(province),
    controlStatus: province.controlStatus ?? "unknown",
    controlConfidence: province.controlConfidence ?? "low",
    controlNote: province.controlNote ?? null,
  });
}

export function createHistoricalProvincePoliticalStates({ date, provinces = [] } = {}) {
  if (!Array.isArray(provinces)) {
    throw new TypeError("provinces must be an array of historical province records.");
  }

  const normalizedDate = normalizeDate(date);
  return Object.freeze(
    provinces.map((province) => createHistoricalProvincePoliticalState({
      date: normalizedDate,
      province,
    })),
  );
}
