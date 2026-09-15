const REQUIRED_PROPERTIES = ["Name", "FromYear", "ToYear", "Type"];

function assertFeatureCollection(input) {
  if (
    !input ||
    input.type !== "FeatureCollection" ||
    !Array.isArray(input.features)
  ) {
    throw new Error("Cliopatria input must be a GeoJSON FeatureCollection.");
  }
}

function integerProperty(properties, key) {
  const value = properties?.[key];
  return Number.isInteger(value) ? value : null;
}

function normalizeCandidate(feature, index) {
  const properties = feature?.properties ?? {};
  const name = typeof properties.Name === "string" ? properties.Name.trim() : "";
  const fromYear = integerProperty(properties, "FromYear");
  const toYear = integerProperty(properties, "ToYear");
  const type = typeof properties.Type === "string" ? properties.Type.trim().toUpperCase() : "";

  const sourceFeatureId = String(
    feature?.id ?? properties.ID ?? properties.id ?? index,
  );

  return {
    sourceFeatureId,
    name,
    fromYear,
    toYear,
    type,
    wikidataId: properties.Wikidata ?? null,
    seshatId: properties.SeshatID ?? null,
    wikipedia: properties.Wikipedia ?? null,
    geometry: feature?.geometry ?? null,
  };
}

export function extractCliopatriaCandidates(
  geojson,
  targetYear,
  { polityOnly = true } = {},
) {
  assertFeatureCollection(geojson);

  if (!Number.isInteger(targetYear) || targetYear < 1 || targetYear > 9999) {
    throw new Error("targetYear must be an integer between 1 and 9999.");
  }

  const candidates = [];
  const excluded = [];

  geojson.features.forEach((feature, index) => {
    const properties = feature?.properties ?? {};
    const missing = REQUIRED_PROPERTIES.filter((key) => properties[key] === undefined);

    if (missing.length > 0) {
      excluded.push({
        index,
        sourceFeatureId: String(feature?.id ?? index),
        reason: `Missing required properties: ${missing.join(", ")}.`,
      });
      return;
    }

    const candidate = normalizeCandidate(feature, index);

    if (candidate.fromYear === null || candidate.toYear === null || candidate.fromYear > candidate.toYear) {
      excluded.push({
        index,
        sourceFeatureId: candidate.sourceFeatureId,
        reason: "Invalid FromYear/ToYear interval.",
      });
      return;
    }

    if (candidate.fromYear > targetYear || targetYear > candidate.toYear) {
      return;
    }

    if (polityOnly && candidate.type !== "POLITY") {
      excluded.push({
        index,
        sourceFeatureId: candidate.sourceFeatureId,
        reason: `Non-political record type: ${candidate.type}.`,
      });
      return;
    }

    if (!candidate.name) {
      excluded.push({
        index,
        sourceFeatureId: candidate.sourceFeatureId,
        reason: "Political candidate has no Name.",
      });
      return;
    }

    candidates.push(candidate);
  });

  return { candidates, excluded };
}

export function groupCliopatriaCandidatesByEntity(candidates) {
  const groups = new Map();

  for (const candidate of candidates) {
    const key = candidate.wikidataId || candidate.seshatId || candidate.name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(candidate);
  }

  return [...groups.entries()].map(([entityKey, records]) => ({
    entityKey,
    names: [...new Set(records.map((record) => record.name))],
    wikidataIds: [...new Set(records.map((record) => record.wikidataId).filter(Boolean))],
    seshatIds: [...new Set(records.map((record) => record.seshatId).filter(Boolean))],
    records,
  }));
}
