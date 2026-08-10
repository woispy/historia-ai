import fs from "node:fs";

/**
 * ============================================================================
 * Historia AI
 * Asset Directory Writer
 * ============================================================================
 *
 * Ensures that an Asset output directory exists.
 */

export function ensureAssetDirectory(
  directory
) {
  fs.mkdirSync(
    directory,
    {
      recursive: true,
    }
  );

  return directory;
}