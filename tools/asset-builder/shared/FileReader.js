import fs from "node:fs";

/**
 * ============================================================================
 * Historia AI
 * Asset Builder
 * File Reader
 * ============================================================================
 *
 * Reads files from disk.
 *
 * Responsibilities
 * ----------------
 * - Read text files.
 * - Read JSON files.
 */

export function readText(
  filePath
) {
  return fs.readFileSync(
    filePath,
    "utf8"
  );
}

export function readJson(
  filePath
) {
  return JSON.parse(
    readText(filePath)
  );
}