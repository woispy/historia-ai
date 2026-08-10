import { createHistoricalAssetId } from "./HistoricalAssetId.js";

function createHeader(assetType, region) {
  return {
    assetType,
    assetVersion: 4,
    generator: "Historia Historical GIS Importer",
    provider: "historical-basemaps",
    dataset: "world_1300.geojson",
    historicalDate: "1300-01-01",
    borderPrecision: region.borderPrecision,
    sourceFeatureId: region.sourceFeatureId,
    sourceFeatureIndex: region.sourceFeatureIndex,
  };
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
