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
 * Geometry Asset Manifest Builder
 * ============================================================================
 *
 * Generates manifest.js and index.js
 * for Geometry Assets.
 */

export function buildGeometryManifest(
  directory
) {
  log(
    "Building Geometry Manifest..."
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
        `import geometry${index} from "./${file}" with { type: "json" };`
    );

  const entries =
    files.map(
      (
        _,
        index
      ) =>
        `  geometry${index},`
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
    `Generated manifest for ${files.length} Geometry Assets.`
  );
}
