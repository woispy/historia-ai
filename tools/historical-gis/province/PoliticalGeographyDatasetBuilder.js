/**
 * Historia AI — Political Geography Dataset Builder
 *
 * Connects the full authority pipeline in one fail-closed build step:
 *
 *   coverage/provinces/provenance manifests
 *     + reviewed province boundary source document
 *     -> ProvinceSourceImporter (reviewed gate, shared-edge classification)
 *     -> AuthoritativeArcRegistry
 *     -> FullFaceAssembly (planar topology + Euler)
 *     -> promoted dataset manifests
 *     -> PoliticalGeographyAuthorityValidator gate
 *
 * The builder never invents, snaps, or repairs geometry, and it never writes
 * to the golden fixture directory. It returns the promoted dataset; persisting
 * it is a deliberate, manual, reviewed step. Any contract violation throws
 * with a full error list and the builder emits nothing.
 */

import { AuthoritativeArcRegistry } from "./AuthoritativeArcGenerator.js";
import { importReviewedProvinceSource } from "./ProvinceSourceImporter.js";
import { assembleFullFaces } from "./FullFaceAssembly.js";
import { validatePoliticalGeographyAuthority } from "./PoliticalGeographyAuthorityValidator.js";

const WORLD_FACE_ID = "world";

function ringInsideBbox(ring, bbox) {
  const [minX, minY, maxX, maxY] = bbox;
  return ring.every(([lon, lat]) => lon >= minX && lon <= maxX && lat >= minY && lat <= maxY);
}

/**
 * Build a promoted political geography dataset from authority manifests and
 * a reviewed boundary source document.
 */
export function buildPoliticalGeographyDataset({ coverage, provinces, provenance, sourceDocument, tolerance } = {}) {
  const errors = [];
  if (!coverage || coverage.schemaVersion !== 1) errors.push("coverage.schemaVersion must be 1");
  if (!provinces || provinces.schemaVersion !== 1) errors.push("provinces.schemaVersion must be 1");
  if (!provenance || provenance.schemaVersion !== 1) errors.push("provenance.schemaVersion must be 1");
  if (errors.length) throw new Error(`Dataset builder rejected input (${errors.length} error${errors.length === 1 ? "" : "s"}):\n- ${errors.join("\n- ")}`);
  if (
  coverage.coverageId !== provinces.coverageId ||
  coverage.coverageId !== provenance.coverageId ||
  coverage.coverageId !== sourceDocument?.coverageId
) {
  throw new Error(
    `Dataset builder rejected input: coverageId mismatch across authority inputs ` +
    `(coverage=${coverage.coverageId}, provinces=${provinces.coverageId}, ` +
    `provenance=${provenance.coverageId}, source=${sourceDocument?.coverageId ?? "missing"})`,
  );
}

  const declaredIds = (provinces.provinces ?? []).map((entry) => String(entry?.provinceId ?? ""));
  const sourceIds = new Set((sourceDocument?.provinces ?? []).map((entry) => String(entry?.provinceId ?? "")));
  const declaredSet = new Set(declaredIds);
  const missingFromSource = declaredIds.filter((id) => !sourceIds.has(id));
  const extraInSource = [...sourceIds].filter((id) => !declaredSet.has(id));
  if (missingFromSource.length || extraInSource.length) {
    throw new Error(
      `Dataset builder rejected source ${sourceDocument?.sourceId ?? "unknown"}: source province IDs must exactly match the declared coverage manifest.`
      + (missingFromSource.length ? `\n- declared but missing from source: ${missingFromSource.join(", ")}` : "")
      + (extraInSource.length ? `\n- in source but not declared: ${extraInSource.join(", ")}` : ""),
    );
  }

  const bbox = coverage.bbox;
  if (!Array.isArray(bbox) || bbox.length !== 4) throw new Error("coverage.bbox must be [minX, minY, maxX, maxY]");
  const outsideBbox = (sourceDocument.provinces ?? [])
    .filter((entry) => !ringInsideBbox(entry?.ring ?? [], bbox))
    .map((entry) => entry.provinceId);
  if (outsideBbox.length) {
    throw new Error(`Dataset builder rejected source ${sourceDocument.sourceId}: provinces outside declared coverage bbox: ${outsideBbox.join(", ")}`);
  }

  let imported;
  try {
    imported = importReviewedProvinceSource(sourceDocument, {
      ...(tolerance != null ? { tolerance } : {}),
      createRegistry: (options) => new AuthoritativeArcRegistry(options),
    });
  } catch (error) {
    throw new Error(`Dataset builder rejected source ${sourceDocument.sourceId}: ${error.message}`, { cause: error });
  }

  const registry = imported.registry;
  const assembly = assembleFullFaces({ topology: registry.toTopology() });
  if (!assembly.validation?.valid) {
    throw new Error(`Dataset builder rejected source ${sourceDocument.sourceId}: assembled topology failed planar validation: ${(assembly.validation?.errors ?? []).join("; ")}`);
  }

  const faceIds = new Set(Object.keys(assembly.topology.faces ?? {}));
  const missingFaces = declaredIds.filter((id) => !faceIds.has(id));
  if (missingFaces.length) {
    throw new Error(`Dataset builder rejected source ${sourceDocument.sourceId}: provinces without an assembled face (internal gap / open boundary): ${missingFaces.join(", ")}`);
  }
  if (!faceIds.has(WORLD_FACE_ID)) {
    throw new Error(`Dataset builder rejected source ${sourceDocument.sourceId}: assembled topology has no ${WORLD_FACE_ID} face`);
  }

  const promotedProvinces = (provinces.provinces ?? []).map((entry) => {
    const sourceProvince = sourceDocument.provinces.find((candidate) => String(candidate.provinceId) === String(entry.provinceId));
    return {
  ...entry,
  reviewStatus: sourceProvince?.reviewStatus,
      geometryStatus: "authoritative",
      geometry: {
        sourceId: sourceDocument.sourceId,
        sourceRef: sourceProvince?.sourceRef ?? sourceDocument.sourceRef,
        confidence: sourceProvince?.confidence ?? null,
      },
    };
  });

  const dataset = {
    coverage: {
      ...coverage,
      status: "ready",
      source: {
        kind: "reviewed-province-boundary-dataset",
        sourceReferences: [{ sourceId: sourceDocument.sourceId, sourceRef: sourceDocument.sourceRef, reviewStatus: sourceDocument.reviewStatus }],
        reviewStatus: sourceDocument.reviewStatus,
      },
      promotion: {
        fallbackProvinceCount: 0,
        overlapCount: 0,
        internalGapCount: 0,
        sharedEdgeMismatchCount: 0,
        provenanceErrorCount: 0,
        ready: true,
      },
    },
    provinces: {
      ...provinces,
      status: "ready",
      geometryAuthority: sourceDocument.sourceId,
      provinces: promotedProvinces,
    },
    provenance: {
      ...provenance,
      status: "ready",
      requiredSource: {
        kind: "reviewed-province-boundary-dataset",
        status: "ready",
        sourceReferences: [{ sourceId: sourceDocument.sourceId, sourceRef: sourceDocument.sourceRef, reviewStatus: sourceDocument.reviewStatus }],
        reviewStatus: sourceDocument.reviewStatus,
      },
      primarySource: sourceDocument.sourceId,
    },
    topology: assembly.topology,
  };

  const gate = validatePoliticalGeographyAuthority(dataset);
  if (!gate.valid) {
    throw new Error(`Dataset builder refused to emit dataset: promoted output failed its own authority gate: ${gate.errors.map((item) => item.message).join("; ")}`);
  }

  return {
    dataset,
    report: {
      coverageId: coverage.coverageId,
      sourceId: sourceDocument.sourceId,
      provinceCount: declaredIds.length,
      arcCount: imported.report.arcCount,
      nodeCount: imported.report.nodeCount,
      faceCount: faceIds.size,
      eulerCharacteristic: assembly.eulerCharacteristic,
      sharedEdgeCount: imported.report.sharedEdgeCount,
      worldEdgeCount: imported.report.worldEdgeCount,
      gateValid: true,
    },
  };
}
