function slug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildHistoricalProvinceAsset(region) {
  const id = `province_1300_${slug(region.id)}`;

  return {
    header: {
      assetType: "province",
      assetVersion: 2,
      generator: "Historia Historical GIS Importer",
      provider: "historical-basemaps",
      dataset: "world_1300.geojson",
      historicalDate: "1300-01-01",
      borderPrecision: region.borderPrecision,
    },
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
      sourceFeatureId: region.id,
      subject: region.subject,
      partOf: region.partOf,
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
  return {
    header: {
      assetType: "geometry",
      assetVersion: 2,
      generator: "Historia Historical GIS Importer",
      provider: "historical-basemaps",
      dataset: "world_1300.geojson",
      historicalDate: "1300-01-01",
      borderPrecision: region.borderPrecision,
    },
    identity: {
      id: `province_1300_${slug(region.id)}`,
      provinceId: `province_1300_${slug(region.id)}`,
    },
    metadata: {
      sourceFeatureId: region.id,
      name: region.name,
      subject: region.subject,
      partOf: region.partOf,
      borderPrecision: region.borderPrecision,
    },
    polygons: region.polygons,
  };
}
