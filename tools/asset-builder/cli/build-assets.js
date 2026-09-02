#!/usr/bin/env node

import { buildAssets } from "../AssetBuilder.js";

try {
  await buildAssets();
  process.exit(0);
} catch (error) {
  console.error("");
  console.error("Asset Builder failed.");
  console.error("");
  console.error(error);
  process.exit(1);
}
