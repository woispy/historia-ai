/**
 * Historia AI — P6 Political Mapbin Builder
 *
 * Converts a promoted political geography dataset into the compiled runtime
 * transport. Fail-closed by contract:
 *
 *  - The dataset must pass the PoliticalGeographyAuthorityValidator gate
 *    before any byte is encoded.
 *  - Only declared province faces are encoded; the world face is excluded.
 *  - Faces with hole rings are rejected (the mapbin encoder stores single
 *    ring tiles without even-odd hole rendering).
 *  - owner/controller/occupation are deliberately NOT encoded: they are
 *    dynamic runtime state, independent of static geometry authority.
 *
 * This builder never invents geometry; it only serializes the reviewed,
 * validated province faces into the existing mapbin format with a stable
 * numericId -> provinceId sidecar mapping.
 */

import { encodeMapBin, inspectMapBin } from "./mapbin-encoder.js";
import { BinaryMapAssetSource } from "../../src/map/runtime/BinaryMapAssetSource.js";
import { validatePoliticalGeographyAuthority } from "../historical-gis/province/PoliticalGeographyAuthorityValidator.js";
import { ringGeometryPoints } from "../historical-gis/province/GeometryValidation.js";

export function buildPoliticalMapbin(dataset) {
  const gate = validatePoliticalGeographyAuthority(dataset);
  if (!gate.valid) {
    throw new Error(
      `Political mapbin build blocked: dataset failed the authority gate (${gate.errors.length} error${gate.errors.length === 1 ? "" : "s"}):\n- ${gate.errors.map((item) => item.message).join("\n- ")}`,
    );
  }

  const arcs = dataset.topology?.arcs ?? {};
  const faces = dataset.topology?.faces ?? {};
  const declared = dataset.provinces?.provinces ?? [];

  const entries = [];
  const idMap = [];
  let numericId = 1;
  for (const entry of declared) {
    const face = faces[entry.provinceId];
    if (!face) throw new Error(`Political mapbin build blocked: face ${entry.provinceId} is missing from the assembled topology`);
    if (Array.isArray(face.holes) && face.holes.length) {
      throw new Error(`Political mapbin build blocked: face ${entry.provinceId} has ${face.holes.length} hole ring(s); hole rendering is not supported by the mapbin encoder yet`);
    }
    const points = ringGeometryPoints(arcs, face.outerRing);
    if (points.length < 3) {
      throw new Error(`Political mapbin build blocked: face ${entry.provinceId} has fewer than three usable ring points`);
    }
    const polygon = points.map((point) => [point.lon, point.lat]);
    entries.push({ province: { id: numericId, identity: { id: numericId } }, geometry: { polygons: [polygon] } });
    idMap.push({ numericId, provinceId: entry.provinceId, geometrySourceId: entry.geometry?.sourceId ?? null, confidence: entry.geometry?.confidence ?? null });
    numericId += 1;
  }

  const buffer = encodeMapBin(entries);
  const source = BinaryMapAssetSource.fromArrayBuffer(buffer);
  const header = inspectMapBin(buffer);

  if (source.provinceCount !== declared.length) {
    throw new Error(`Political mapbin round-trip mismatch: encoded ${declared.length} provinces, decoded ${source.provinceCount}`);
  }
  for (let index = 0; index < idMap.length; index += 1) {
    if (source.getProvinceId(index) !== idMap[index].numericId) {
      throw new Error(`Political mapbin round-trip mismatch: province ${idMap[index].provinceId} lost its stable numeric identity`);
    }
  }

  return {
    buffer,
    source,
    idMap,
    report: {
      provinces: declared.length,
      geometryPointCount: header.geometryPointCount,
      totalByteLength: header.totalByteLength,
      authoritySourceId: dataset.provinces.geometryAuthority,
    },
  };
}
