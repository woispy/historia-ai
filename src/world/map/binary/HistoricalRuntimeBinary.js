/**
 * Historia AI — binary historical map data plane.
 *
 * The manifest is the small control plane; region .bin files are the runtime
 * data plane. Geometry coordinates are stored as Float64 and all string data
 * is interned in a deterministic string table. No JSON geometry is required
 * at runtime.
 */

export const HISTORICAL_RUNTIME_BINARY = Object.freeze({
  MAGIC: "HMAP",
  VERSION: 1,
  HEADER_BYTES: 48,
});

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function asFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeString(value) {
  return value === null || value === undefined ? "" : String(value);
}

function stableJson(value) {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = value[key];
        return result;
      }, {}),
  );
}

function collectStrings(region) {
  const values = new Set();
  const add = (value) => {
    const normalized = normalizeString(value);
    if (normalized) values.add(normalized);
  };

  add(region.regionId);
  add(region.historicalDate);

  for (const province of region.provinces ?? []) {
    add(province?.identity?.id);
    add(province?.identity?.name);
    add(province?.references?.geometryId);
    add(province?.references?.countryId);
    add(province?.references?.capitalCityId);
    add(province?.ownership?.countryId);
    add(province?.ownership?.ownerId);
    add(province?.historical?.sourceFeatureId);
    add(province?.historical?.sourceName);
    add(province?.historical?.subject);
    add(province?.historical?.partOf);
    add(province?.historical?.classification);
    add(province?.historical?.precision);
    add(province?.historical?.inferenceNotice);
    add(province?.administration?.governorId);
    add(province?.culture?.primaryCulture);
    add(province?.religion?.primaryReligion);
    add(stableJson(province?.historical?.anchor));
  }

  for (const geometry of region.geometries ?? []) {
    add(geometry?.identity?.id);
    add(geometry?.identity?.provinceId);
    add(geometry?.metadata?.sourceFeatureId);
    add(geometry?.metadata?.name);
    add(geometry?.metadata?.subject);
    add(geometry?.metadata?.partOf);
  }

  return ["", ...[...values].sort((left, right) => left.localeCompare(right))];
}

function createWriter(initialBytes = 1024) {
  let buffer = new ArrayBuffer(initialBytes);
  let view = new DataView(buffer);
  let offset = 0;

  const ensure = (bytes) => {
    if (offset + bytes <= buffer.byteLength) return;
    let size = buffer.byteLength;
    while (size < offset + bytes) size *= 2;
    const next = new ArrayBuffer(size);
    new Uint8Array(next).set(new Uint8Array(buffer));
    buffer = next;
    view = new DataView(buffer);
  };

  return {
    get offset() {
      return offset;
    },
    u16(value) {
      ensure(2);
      view.setUint16(offset, value, true);
      offset += 2;
    },
    u32(value) {
      ensure(4);
      view.setUint32(offset, value, true);
      offset += 4;
    },
    i32(value) {
      ensure(4);
      view.setInt32(offset, value, true);
      offset += 4;
    },
    f64(value) {
      ensure(8);
      view.setFloat64(offset, asFiniteNumber(value), true);
      offset += 8;
    },
    bytes(value) {
      ensure(value.byteLength);
      new Uint8Array(buffer, offset, value.byteLength).set(value);
      offset += value.byteLength;
    },
    finish() {
      return new Uint8Array(buffer, 0, offset);
    },
  };
}

function stringIdFactory(strings) {
  const ids = new Map(strings.map((value, index) => [value, index]));
  return (value) => ids.get(normalizeString(value)) ?? 0;
}

function countPolygons(region) {
  return (region.geometries ?? []).reduce(
    (total, geometry) => total + (Array.isArray(geometry?.polygons) ? geometry.polygons.length : 0),
    0,
  );
}

function countVertices(region) {
  return (region.geometries ?? []).reduce(
    (total, geometry) => total + (geometry.polygons ?? []).reduce(
      (polygonTotal, polygon) => polygonTotal + (Array.isArray(polygon) ? polygon.length : 0),
      0,
    ),
    0,
  );
}

export function encodeHistoricalRuntimeRegion(region) {
  assert(region && typeof region === "object", "Historical binary region must be an object.");
  assert(Array.isArray(region.provinces), "Historical binary region requires provinces.");
  assert(Array.isArray(region.geometries), "Historical binary region requires geometries.");

  const strings = collectStrings(region);
  const stringId = stringIdFactory(strings);
  const polygonCount = countPolygons(region);
  const vertexCount = countVertices(region);
  const writer = createWriter();

  const encoder = textEncoder;
  const magic = encoder.encode(HISTORICAL_RUNTIME_BINARY.MAGIC);
  writer.bytes(magic);
  writer.u16(HISTORICAL_RUNTIME_BINARY.VERSION);
  writer.u16(0x0102);
  writer.u32(HISTORICAL_RUNTIME_BINARY.HEADER_BYTES);
  writer.u32(stringId(region.regionId));
  writer.u32(stringId(region.historicalDate));
  writer.u32(region.provinces.length);
  writer.u32(region.geometries.length);
  writer.u32(polygonCount);
  writer.u32(vertexCount);
  writer.u32(strings.length);
  writer.u32(0);
  writer.u32(0);
  writer.u32(0);

  for (const value of strings) {
    const bytes = encoder.encode(value);
    writer.u32(bytes.byteLength);
    writer.bytes(bytes);
  }

  for (const province of region.provinces) {
    writer.u32(stringId(province?.identity?.id));
    writer.u32(stringId(province?.identity?.name));
    writer.u32(stringId(province?.references?.geometryId));
    writer.u32(stringId(province?.references?.countryId));
    writer.u32(stringId(province?.references?.capitalCityId));
    writer.u32(stringId(province?.ownership?.countryId));
    writer.u32(stringId(province?.ownership?.ownerId));
    writer.u32(stringId(province?.historical?.sourceFeatureId));
    writer.u32(stringId(province?.historical?.sourceName));
    writer.u32(stringId(province?.historical?.subject));
    writer.u32(stringId(province?.historical?.partOf));
    writer.u32(stringId(province?.historical?.classification));
    writer.u32(stringId(province?.historical?.precision));
    writer.u32(stringId(province?.historical?.inferenceNotice));
    writer.u32(stringId(province?.administration?.governorId));
    writer.u32(stringId(province?.culture?.primaryCulture));
    writer.u32(stringId(province?.religion?.primaryReligion));
    writer.u32(stringId(stableJson(province?.historical?.anchor)));
    writer.i32(Number.isInteger(province?.historical?.sourceFeatureIndex) ? province.historical.sourceFeatureIndex : -1);
    writer.f64(province?.historical?.borderPrecision);
    writer.f64(province?.population?.total);
    writer.f64(province?.economy?.development);
    writer.f64(province?.economy?.wealth);
    writer.f64(province?.military?.supplyLimit);
  }

  let polygonCursor = 0;
  let vertexCursor = 0;
  const polygonRecords = [];
  for (const geometry of region.geometries) {
    const polygons = Array.isArray(geometry?.polygons) ? geometry.polygons : [];
    const start = polygonCursor;
    for (const polygon of polygons) {
      const points = Array.isArray(polygon) ? polygon : [];
      polygonRecords.push({ start: vertexCursor, count: points.length });
      polygonCursor += 1;
      vertexCursor += points.length;
    }

    writer.u32(stringId(geometry?.identity?.id));
    writer.u32(stringId(geometry?.identity?.provinceId));
    writer.u32(stringId(geometry?.metadata?.sourceFeatureId));
    writer.u32(stringId(geometry?.metadata?.name));
    writer.u32(stringId(geometry?.metadata?.subject));
    writer.u32(stringId(geometry?.metadata?.partOf));
    writer.u32(start);
    writer.u32(polygons.length);
    writer.i32(Number.isInteger(geometry?.metadata?.sourceFeatureIndex) ? geometry.metadata.sourceFeatureIndex : -1);
    writer.f64(geometry?.metadata?.borderPrecision);
  }

  for (const record of polygonRecords) {
    writer.u32(record.start);
    writer.u32(record.count);
  }

  for (const geometry of region.geometries) {
    for (const polygon of geometry.polygons ?? []) {
      for (const point of polygon ?? []) {
        assert(Array.isArray(point) && point.length >= 2, "Historical binary geometry contains an invalid coordinate.");
        writer.f64(point[0]);
        writer.f64(point[1]);
      }
    }
  }

  return writer.finish();
}

function createReader(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;
  const ensure = (size) => assert(offset + size <= data.byteLength, "Historical binary asset is truncated.");
  return {
    get offset() {
      return offset;
    },
    u16() {
      ensure(2);
      const value = view.getUint16(offset, true);
      offset += 2;
      return value;
    },
    u32() {
      ensure(4);
      const value = view.getUint32(offset, true);
      offset += 4;
      return value;
    },
    i32() {
      ensure(4);
      const value = view.getInt32(offset, true);
      offset += 4;
      return value;
    },
    f64() {
      ensure(8);
      const value = view.getFloat64(offset, true);
      offset += 8;
      assert(Number.isFinite(value), "Historical binary asset contains a non-finite number.");
      return value;
    },
    bytes(size) {
      ensure(size);
      const result = data.slice(offset, offset + size);
      offset += size;
      return result;
    },
  };
}

function readStringTable(reader, count) {
  const strings = [];
  for (let index = 0; index < count; index += 1) {
    const byteLength = reader.u32();
    strings.push(textDecoder.decode(reader.bytes(byteLength)));
  }
  return strings;
}

function stringFrom(strings, id, label) {
  assert(id < strings.length, `Historical binary ${label} references an invalid string id.`);
  return strings[id] || null;
}

export function decodeHistoricalRuntimeRegion(bytes, metadata = {}) {
  const reader = createReader(bytes);
  const magic = textDecoder.decode(reader.bytes(4));
  assert(magic === HISTORICAL_RUNTIME_BINARY.MAGIC, "Invalid historical binary map magic.");
  const version = reader.u16();
  assert(version === HISTORICAL_RUNTIME_BINARY.VERSION, `Unsupported historical binary map version: ${version}.`);
  const endian = reader.u16();
  assert(endian === 0x0102, "Historical binary map has an unsupported byte order.");
  const headerBytes = reader.u32();
  assert(headerBytes === HISTORICAL_RUNTIME_BINARY.HEADER_BYTES, "Historical binary map header size mismatch.");

  const regionId = reader.u32();
  const historicalDate = reader.u32();
  const provinceCount = reader.u32();
  const geometryCount = reader.u32();
  const polygonCount = reader.u32();
  const vertexCount = reader.u32();
  const stringCount = reader.u32();
  reader.u32();
  reader.u32();
  reader.u32();

  const strings = readStringTable(reader, stringCount);
  const resolvedRegionId = stringFrom(strings, regionId, "region id");
  const resolvedDate = stringFrom(strings, historicalDate, "historical date");

  const provinces = [];
  for (let index = 0; index < provinceCount; index += 1) {
    const id = stringFrom(strings, reader.u32(), "province id");
    const name = stringFrom(strings, reader.u32(), "province name");
    const geometryId = stringFrom(strings, reader.u32(), "geometry id");
    const countryId = stringFrom(strings, reader.u32(), "country id");
    const capitalCityId = stringFrom(strings, reader.u32(), "capital city id");
    const ownershipCountryId = stringFrom(strings, reader.u32(), "ownership country id");
    const ownerId = stringFrom(strings, reader.u32(), "owner id");
    const sourceFeatureId = stringFrom(strings, reader.u32(), "source feature id");
    const sourceName = stringFrom(strings, reader.u32(), "source name");
    const subject = stringFrom(strings, reader.u32(), "subject");
    const partOf = stringFrom(strings, reader.u32(), "partOf");
    const classification = stringFrom(strings, reader.u32(), "classification");
    const precision = stringFrom(strings, reader.u32(), "precision");
    const inferenceNotice = stringFrom(strings, reader.u32(), "inference notice");
    const governorId = stringFrom(strings, reader.u32(), "governor id");
    const primaryCulture = stringFrom(strings, reader.u32(), "primary culture");
    const primaryReligion = stringFrom(strings, reader.u32(), "primary religion");
    const anchorRaw = stringFrom(strings, reader.u32(), "anchor");
    const sourceFeatureIndex = reader.i32();
    const borderPrecision = reader.f64();
    const populationTotal = reader.f64();
    const development = reader.f64();
    const wealth = reader.f64();
    const supplyLimit = reader.f64();

    let anchor = null;
    if (anchorRaw) {
      try {
        anchor = JSON.parse(anchorRaw);
      } catch {
        throw new Error(`Historical binary province ${id} has an invalid anchor payload.`);
      }
    }

    provinces.push({
      header: {
        assetType: "province",
        assetVersion: 4,
        historicalDate: resolvedDate,
      },
      identity: { id, name },
      references: { geometryId, countryId, capitalCityId },
      ownership: { countryId: ownershipCountryId, ownerId },
      historical: {
        sourceFeatureId,
        sourceFeatureIndex: sourceFeatureIndex < 0 ? undefined : sourceFeatureIndex,
        sourceName,
        subject,
        partOf,
        borderPrecision,
        ...(classification ? { classification } : {}),
        ...(precision ? { precision } : {}),
        ...(anchor !== null ? { anchor } : {}),
        ...(inferenceNotice ? { inferenceNotice } : {}),
      },
      administration: { governorId },
      population: { total: populationTotal },
      economy: { development, wealth },
      military: { supplyLimit },
      culture: { primaryCulture },
      religion: { primaryReligion },
    });
  }

  const geometryRecords = [];
  for (let index = 0; index < geometryCount; index += 1) {
    geometryRecords.push({
      id: stringFrom(strings, reader.u32(), "geometry identity"),
      provinceId: stringFrom(strings, reader.u32(), "geometry province id"),
      sourceFeatureId: stringFrom(strings, reader.u32(), "geometry source feature id"),
      name: stringFrom(strings, reader.u32(), "geometry name"),
      subject: stringFrom(strings, reader.u32(), "geometry subject"),
      partOf: stringFrom(strings, reader.u32(), "geometry partOf"),
      polygonStart: reader.u32(),
      polygonCount: reader.u32(),
      sourceFeatureIndex: reader.i32(),
      borderPrecision: reader.f64(),
    });
  }

  const polygons = [];
  for (let index = 0; index < polygonCount; index += 1) {
    polygons.push({ start: reader.u32(), count: reader.u32() });
  }

  const vertices = new Array(vertexCount);
  for (let index = 0; index < vertexCount; index += 1) {
    vertices[index] = [reader.f64(), reader.f64()];
  }

  assert(reader.offset === bytes.byteLength, "Historical binary asset contains trailing bytes.");

  const geometries = geometryRecords.map((record) => ({
    header: {
      assetType: "geometry",
      assetVersion: 4,
      historicalDate: resolvedDate,
    },
    identity: { id: record.id, provinceId: record.provinceId },
    metadata: {
      sourceFeatureId: record.sourceFeatureId,
      sourceFeatureIndex: record.sourceFeatureIndex < 0 ? undefined : record.sourceFeatureIndex,
      name: record.name,
      subject: record.subject,
      partOf: record.partOf,
      borderPrecision: record.borderPrecision,
    },
    polygons: polygons
      .slice(record.polygonStart, record.polygonStart + record.polygonCount)
      .map((polygon) => vertices.slice(polygon.start, polygon.start + polygon.count)),
  }));

  const actualPolygonCount = geometries.reduce((total, geometry) => total + geometry.polygons.length, 0);
  const actualVertexCount = geometries.reduce(
    (total, geometry) => total + geometry.polygons.reduce((polygonTotal, polygon) => polygonTotal + polygon.length, 0),
    0,
  );
  assert(actualPolygonCount === polygonCount, "Historical binary polygon count mismatch.");
  assert(actualVertexCount === vertexCount, "Historical binary vertex count mismatch.");

  return {
    schemaVersion: 3,
    assetType: "historical-runtime-region",
    historicalDate: resolvedDate,
    regionId: resolvedRegionId,
    source: metadata.source ?? null,
    counts: {
      provinces: provinces.length,
      geometries: geometries.length,
      polygons: actualPolygonCount,
    },
    provinces,
    geometries,
  };
}
