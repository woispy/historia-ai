import { createHistoricalAssetId } from "./HistoricalAssetId.js";

function createHeader(assetType, region) {
  return {
    assetType,
    assetVersion: 4,
    generator: "Historia Historical GIS Importer",
    provider: region.provider ?? "historical-basemaps",
    dataset: region.dataset ?? "world_1300.geojson",
    historicalDate: "1300-01-01",
    borderPrecision: region.borderPrecision,
    sourceFeatureId: region.sourceFeatureId,
    sourceFeatureIndex: region.sourceFeatureIndex,
  };
}

export function buildCuratedRegionalAssets(regionalLayer) {
  if (!regionalLayer || !Array.isArray(regionalLayer.regions)) {
    throw new Error("Regional historical layer must contain a regions array.");
  }

  return regionalLayer.regions.map((region, sourceFeatureIndex) => {
    if (!region?.id || !region?.name || !region?.countryId || !Array.isArray(region.polygons)) {
      throw new Error("Regional historical layer contains an invalid region.");
    }

    const normalized = {
      assetId: region.id,
      name: region.name,
      sourceName: region.name,
      subject: region.countryId,
      partOf: "Anatolia and Byzantine regional layer",
      sourceFeatureId: region.id,
      sourceFeatureIndex,
      borderPrecision: 1,
      polygons: region.polygons,
      provider: "historia-ai-curated",
      dataset: regionalLayer.id,
    };

    const province = buildHistoricalProvinceAsset(normalized);
    province.ownership.countryId = region.countryId;
    province.ownership.ownerId = region.countryId;
    province.historical = {
      ...province.historical,
      classification: "curated-regional-gameplay-overlay",
      precision: regionalLayer.precision ?? "approximate",
      anchor: region.anchor ?? null,
      inferenceNotice: regionalLayer.notice ?? null,
    };
    return { province, geometry: buildHistoricalGeometryAsset(normalized) };
  });
}

function getAssetId(region) {
  return (
    region.assetId ??
    createHistoricalAssetId({
      year: 1300,
      sourceFeatureId: region.sourceFeatureId,
      sourceFeatureIndex: region.sourceFeatureIndex,
    })
  );
}

export function buildHistoricalProvinceAsset(region) {
  const id = getAssetId(region);

  return {
    header: createHeader("province", region),
    identity: {
      id,
      name: region.name,
    },
    references: {
      geometryId: id,
      countryId: null,
      capitalCityId: null,
    },
    ownership: {
      countryId: null,
      ownerId: null,
    },
    historical: {
      sourceFeatureId: region.sourceFeatureId,
      sourceFeatureIndex: region.sourceFeatureIndex,
      sourceName: region.sourceName ?? region.name,
      subject: region.subject,
      partOf: region.partOf,
      borderPrecision: region.borderPrecision,
    },
    administration: {
      governorId: null,
    },
    population: {
      total: 0,
    },
    economy: {
      development: 0,
      wealth: 0,
    },
    military: {
      supplyLimit: 0,
    },
    culture: {
      primaryCulture: null,
    },
    religion: {
      primaryReligion: null,
    },
  };
}

export function buildHistoricalGeometryAsset(region) {
  const id = getAssetId(region);

  return {
    header: createHeader("geometry", region),
    identity: {
      id,
      provinceId: id,
    },
    metadata: {
      sourceFeatureId: region.sourceFeatureId,
      sourceFeatureIndex: region.sourceFeatureIndex,
      name: region.name,
      subject: region.subject,
      partOf: region.partOf,
      borderPrecision: region.borderPrecision,
    },
    polygons: region.polygons,
  };
}
