import fs from "node:fs";
import path from "node:path";

/**
 * ============================================================================
 * Historia AI
 * Asset Builder
 * File Writer
 * ============================================================================
 *
 * Writes text files to disk.
 */

export function ensureDirectory(
  directory
) {
  fs.mkdirSync(
    directory,
    {
      recursive: true,
    }
  );
}

export function writeText(
  filePath,
  content
) {
  ensureDirectory(
    path.dirname(
      filePath
    )
  );

  fs.writeFileSync(
    filePath,
    content,
    "utf8"
  );
}