import { createFamilyModel } from "./FamilyModel.js";

/**
 * ============================================================================
 * Family Factory
 * ============================================================================
 */

export function createFamily(data) {
  if (!data) {
    throw new Error("Family data is required.");
  }

  if (!data.id) {
    throw new Error("Family id is required.");
  }

  if (!data.name) {
    throw new Error("Family name is required.");
  }

  if (!data.founderCharacterId) {
    throw new Error("Founder character is required.");
  }

  if (!data.culture) {
    throw new Error("Family culture is required.");
  }

  if (!data.religion) {
    throw new Error("Family religion is required.");
  }

  if (!data.createdDate) {
    throw new Error("Family creation date is required.");
  }

  return createFamilyModel(data);
}