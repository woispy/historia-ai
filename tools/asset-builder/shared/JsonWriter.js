import {
  writeText,
} from "./FileWriter.js";

/**
 * ============================================================================
 * Historia AI
 * Asset Builder
 * JSON Writer
 * ============================================================================
 *
 * Writes formatted JSON files.
 */

export function writeJson(
  filePath,
  value
) {
  writeText(
    filePath,

    JSON.stringify(
      value,
      null,
      2
    )
  );
}