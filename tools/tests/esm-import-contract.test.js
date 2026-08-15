import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const sourceRoots = ["src", "tools"];
const ignoredExtensions = new Set([
  ".css",
  ".json",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

const violations = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(absolutePath);
      continue;
    }

    if (!entry.name.endsWith(".js")) {
      continue;
    }

    const source = fs.readFileSync(absolutePath, "utf8");
    const importPattern = /(?:from\s*|import\s*\()(["'])(\.\.?\/[^"']+)\1/g;

    for (const match of source.matchAll(importPattern)) {
      const specifier = match[2];
      const extension = path.extname(specifier);

      if (extension || ignoredExtensions.has(extension)) {
        continue;
      }

      const resolved = path.resolve(path.dirname(absolutePath), specifier);
      const candidates = [
        `${resolved}.js`,
        path.join(resolved, "index.js"),
      ];

      if (candidates.some((candidate) => fs.existsSync(candidate))) {
        violations.push({
          file: path.relative(projectRoot, absolutePath),
          specifier,
        });
      }
    }
  }
}

for (const root of sourceRoots) {
  walk(path.join(projectRoot, root));
}

assert.deepEqual(
  violations,
  [],
  `Found extensionless relative ESM imports:\n${violations
    .map(({ file, specifier }) => `- ${file}: ${specifier}`)
    .join("\n")}`
);

console.log("esm-import-contract.test.js: all relative ESM imports use explicit file extensions");
