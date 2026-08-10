import path from "node:path";

import {
  writeJson,
} from "../JsonWriter.js";

import {
  ensureAssetDirectory,
} from "./AssetDirectoryWriter.js";

/**
 * ============================================================================
 * Historia AI
 * Asset Writer
 * ============================================================================
 *
 * Writes Historia Assets to disk.
 */

export function writeAssets({
  directory,
  assets,
  getFileName,
}) {
  ensureAssetDirectory(
    directory
  );

  for (const asset of assets) {
    writeJson(
      path.join(
        directory,
        getFileName(asset)
      ),
      asset
    );
  }

  return assets.length;
}