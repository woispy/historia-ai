#!/usr/bin/env node

import {
  buildAssets,
} from "../AssetBuilder.js";

/**
 * ============================================================================
 * Historia AI
 * Asset Builder CLI
 * ============================================================================
 *
 * Command line entry point for
 * generating all Historia AI Assets.
 */

try {
  buildAssets();

  process.exit(0);
}
catch (error) {
  console.error("");

  console.error(
    "Asset Builder failed."
  );

  console.error("");

  console.error(error);

  process.exit(1);
}