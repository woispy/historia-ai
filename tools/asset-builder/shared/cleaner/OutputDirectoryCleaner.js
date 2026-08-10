import fs from "node:fs";
import path from "node:path";

import {
  log,
  success,
} from "../Logger.js";

/**
 * ============================================================================
 * Historia AI
 * Output Directory Cleaner
 * ============================================================================
 *
 * Removes previously generated assets before
 * a new Asset Build starts.
 *
 * This guarantees deterministic builds.
 */

export function cleanOutputDirectory(
  directory
) {
  if (
    !fs.existsSync(
      directory
    )
  ) {
    return;
  }

  log(
    `Cleaning ${directory}`
  );

  for (
    const file of
    fs.readdirSync(
      directory
    )
  ) {
    const filePath =
      path.join(
        directory,
        file
      );

    if (
      fs.statSync(
        filePath
      ).isDirectory()
    ) {
      continue;
    }

    fs.unlinkSync(
      filePath
    );
  }

  success(
    "Output directory cleaned."
  );
}