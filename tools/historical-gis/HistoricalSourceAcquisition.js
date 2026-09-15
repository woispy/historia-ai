import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const TEMPORAL_KEYS = {
  fromYear: ["FromYear", "fromYear", "FROMYEAR", "from_year"],
  toYear: ["ToYear", "toYear", "TOYEAR", "to_year"],
};

function assertFeatureCollection(input) {
  if (
    !input ||
    input.type !== "FeatureCollection" ||
    !Array.isArray(input.features)
  ) {
    throw new Error(
      "Historical source input must be a GeoJSON FeatureCollection.",
    );
  }
}

function firstProperty(properties, keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      return properties[key];
    }
  }
  return undefined;
}

function parseYear(value) {
  if (value === undefined || value === null || value === "") return null;
  const year = Number(value);
  return Number.isInteger(year) ? year : null;
}

export function readTemporalInterval(feature) {
  const properties = feature?.properties ?? {};
  const rawFromYear = firstProperty(properties, TEMPORAL_KEYS.fromYear);
  const rawToYear = firstProperty(properties, TEMPORAL_KEYS.toYear);

  if (rawFromYear === undefined && rawToYear === undefined) {
    return { status: "timeless", fromYear: null, toYear: null };
  }

  const fromYear = parseYear(rawFromYear);
  const toYear = parseYear(rawToYear);

  if (fromYear === null || toYear === null) {
    return {
      status: "invalid",
      fromYear,
      toYear,
      reason: "Temporal interval must provide integer FromYear and ToYear values.",
    };
  }

  if (fromYear > toYear) {
    return {
      status: "invalid",
      fromYear,
      toYear,
      reason: "FromYear cannot be greater than ToYear.",
    };
  }

  return { status: "dated", fromYear, toYear };
}

export function isApplicableToYear(interval, targetYear, allowTimeless = false) {
  if (!Number.isInteger(targetYear) || targetYear < 1 || targetYear > 9999) {
    throw new Error("targetYear must be an integer between 1 and 9999.");
  }

  if (interval.status === "dated") {
    return interval.fromYear <= targetYear && targetYear <= interval.toYear;
  }

  return interval.status === "timeless" && allowTimeless;
}

export function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function filterHistoricalFeatures(
  geojson,
  targetYear,
  { allowTimeless = false } = {},
) {
  assertFeatureCollection(geojson);

  const retained = [];
  const excluded = [];
  const warnings = [];

  geojson.features.forEach((feature, index) => {
    const interval = readTemporalInterval(feature);
    const sourceFeatureId = String(
      feature?.id ?? feature?.properties?.ID ?? feature?.properties?.id ?? index,
    );

    if (interval.status === "invalid") {
      excluded.push({ index, sourceFeatureId, reason: interval.reason });
      return;
    }

    if (interval.status === "timeless") {
      if (allowTimeless) {
        retained.push({ feature, index, interval });
        warnings.push({
          index,
          sourceFeatureId,
          warning:
            "Feature has no temporal interval; retained only because allowTimeless=true.",
        });
      } else {
        excluded.push({
          index,
          sourceFeatureId,
          reason:
            "Feature has no temporal interval; evidence is not silently assumed applicable to the target year.",
        });
      }
      return;
    }

    if (isApplicableToYear(interval, targetYear)) {
      retained.push({ feature, index, interval });
    } else {
      excluded.push({
        index,
        sourceFeatureId,
        reason: `Feature interval ${interval.fromYear}-${interval.toYear} does not include ${targetYear}.`,
      });
    }
  });

  return { retained, excluded, warnings };
}

export async function readHistoricalSourceInput({ inputPath, url }) {
  if ((inputPath && url) || (!inputPath && !url)) {
    throw new Error("Provide exactly one of inputPath or url.");
  }

  if (inputPath) {
    return {
      rawText: await fs.readFile(inputPath, "utf8"),
      acquisition: { mode: "local-file", inputPath },
    };
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Unable to download historical source: ${response.status} ${response.statusText}`,
    );
  }

  return { rawText: await response.text(), acquisition: { mode: "url", url } };
}

export async function acquireHistoricalSource({
  inputPath,
  url,
  sourceId,
  provider,
  dataset,
  version = null,
  targetYear,
  scenarioDate = `${String(targetYear).padStart(4, "0")}-01-01`,
  projection = "EPSG:4326",
  license = null,
  acquiredAt = null,
  allowTimeless = false,
}) {
  if (!sourceId) throw new Error("sourceId is required.");
  if (!provider) throw new Error("provider is required.");
  if (!dataset) throw new Error("dataset is required.");
  if (!Number.isInteger(targetYear)) throw new Error("targetYear is required.");

  const { rawText, acquisition } = await readHistoricalSourceInput({ inputPath, url });
  const inputSha256 = sha256Text(rawText);
  const geojson = JSON.parse(rawText);
  const filtered = filterHistoricalFeatures(geojson, targetYear, { allowTimeless });

  return {
    evidenceGeoJson: {
      type: "FeatureCollection",
      features: filtered.retained.map(({ feature }) => feature),
    },
    report: {
      schemaVersion: 1,
      assetType: "historical-source-evidence",
      scenarioDate,
      source: {
        sourceId,
        provider,
        dataset,
        version,
        projection,
        license,
        inputSha256,
        authorityStatus: "evidence-only",
        ...(acquisition.mode === "url"
          ? { sourceUrl: acquisition.url }
          : { inputPath: acquisition.inputPath }),
        ...(acquiredAt ? { acquiredAt } : {}),
      },
      temporalFilter: {
        targetYear,
        rule: "FromYear <= targetYear <= ToYear",
        timelessPolicy: allowTimeless ? "retain-with-warning" : "exclude-fail-closed",
      },
      counts: {
        inputFeatures: geojson.features.length,
        retainedFeatures: filtered.retained.length,
        excludedFeatures: filtered.excluded.length,
        warnings: filtered.warnings.length,
      },
      excluded: filtered.excluded,
      warnings: filtered.warnings,
      promotion: {
        status: "not-promoted",
        reason:
          "Acquisition output is source evidence only; canonical historical political geography requires reconciliation, provenance, review, topology, and physical-boundary validation.",
      },
    },
  };
}

export async function writeHistoricalSourceEvidence({
  outputPath,
  manifestPath,
  evidenceGeoJson,
  report,
}) {
  if (!outputPath) throw new Error("outputPath is required.");
  if (!manifestPath) throw new Error("manifestPath is required.");

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(evidenceGeoJson, null, 2)}\n`, "utf8");
  await fs.writeFile(manifestPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

export { assertFeatureCollection, TEMPORAL_KEYS };