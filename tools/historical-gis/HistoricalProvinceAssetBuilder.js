function slug(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createHeader(assetType, region) {
  return {
    assetType,
    assetVersion: 3,
    generator: "Historia Historical GIS Importer",
    provider: "historical-basemaps",
    dataset: "world_1300.geojson",
    historicalDate: "1300-01-01",
    borderPrecision: region.borderPrecision,
    sourceFeatureId: region.sourceFeatureId,
  };
}

export function buildHistoricalProvinceAsset(region) {
  const id = `province_1300_${slug(region.id)}`;

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
  const id = `province_1300_${slug(region.id)}`;

  return {
    header: createHeader("geometry", region),
    identity: {
      id,
      provinceId: id,
    },
    metadata: {
      sourceFeatureId: region.sourceFeatureId,
      name: region.name,
      subject: region.subject,
      partOf: region.partOf,
      borderPrecision: region.borderPrecision,
    },
    polygons: region.polygons,
  };
}
