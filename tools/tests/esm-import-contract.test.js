import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const entryPoints = [
  "tools/tests/runtime-engine.test.js",
];

const violations = [];
const visited = new Set();

function resolveLocalModule(importerPath, specifier) {
  const resolved = path.resolve(
    path.dirname(importerPath),
    specifier
  );

  if (path.extname(specifier)) {
    return fs.existsSync(resolved) ? resolved : null;
  }

  const candidates = [
    `${resolved}.js`,
    path.join(resolved, "index.js"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function inspectFile(absolutePath) {
  if (visited.has(absolutePath)) {
    return;
  }

  visited.add(absolutePath);

  const source = fs.readFileSync(absolutePath, "utf8");
  const importPattern = /(?:\bfrom\s+|\bimport\s*\()\s*["'](\.{1,2}\/[^"']+)["']/g;

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    const extension = path.extname(specifier);
    const resolved = resolveLocalModule(absolutePath, specifier);

    if (!extension) {
      if (!resolved) {
        continue;
      }

      violations.push({
        file: path.relative(projectRoot, absolutePath),
        specifier,
      });
    }

    if (resolved) {
      inspectFile(resolved);
    }
  }
}

for (const entryPoint of entryPoints) {
  inspectFile(path.join(projectRoot, entryPoint));
}

assert.deepEqual(
  violations,
  [],
  `Found extensionless relative ESM imports in the runtime dependency graph:\n${violations
    .map(({ file, specifier }) => `- ${file}: ${specifier}`)
    .join("\n")}`
);

console.log(
  `esm-import-contract.test.js: runtime dependency graph is ESM-safe (${visited.size} modules checked)`
);
