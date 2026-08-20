import fs from "node:fs";
import path from "node:path";

import {
  writeText,
  log,
  success,
} from "../../shared/index.js";

/**
 * ============================================================================
 * Historia AI
 * Province Asset Manifest Builder
 * ============================================================================
 *
 * Generates manifest.js and index.js
 * for Province Assets.
 */

export function buildProvinceManifest(
  directory
) {
  log(
    "Building Province Manifest..."
  );

  const files =
    fs
      .readdirSync(
        directory
      )
      .filter(
        (file) =>
          file.endsWith(".json")
      )
      .sort();

  const imports =
    files.map(
      (
        file,
        index
      ) =>
        `import province${index} from "./${file}" with { type: "json" };`
    );

  const entries =
    files.map(
      (
        _,
        index
      ) =>
        `  province${index},`
    );

  writeText(
    path.join(
      directory,
      "manifest.js"
    ),

`${imports.join("\n")}

export default [
${entries.join("\n")}
];
`
  );

  writeText(
    path.join(
      directory,
      "index.js"
    ),

`import manifest from "./manifest.js";

export default manifest;
`
  );

  success(
    `Generated manifest for ${files.length} Province Assets.`
  );
}
