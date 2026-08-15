import { createSelectionModel } from "./SelectionModel.js";

/**
 * ============================================================================
 * Selection Factory
 * ============================================================================
 */

export function createSelection(data) {
  if (!data) {
    throw new Error("Selection data is required.");
  }

  if (!data.type) {
    throw new Error("Selection type is required.");
  }

  if (!data.id) {
    throw new Error("Selection id is required.");
  }

  return createSelectionModel(data);
}
