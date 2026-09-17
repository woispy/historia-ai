import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPoliticalGeographyAuthorityReady,
  validatePoliticalGeographyAuthority,
} from "../province/PoliticalGeographyAuthorityValidator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixtureDirectory = path.join(root, "tools/tests/fixtures/political-geography/anatolia-1300");
const readJson = async (name) => JSON.parse(await fs.readFile(path.join(fixtureDirectory, name), "utf8"));

const input = {
  coverage: await readJson("coverage.json"),
  provinces: await readJson("provinces.json"),
  provenance: await readJson("provenance.json"),
};

const result = validatePoliticalGeographyAuthority(input);
if (!result.valid) {
  console.error(`Political Geography Authority blocked: ${result.errors.length} contract errors.`);
  for (const item of result.errors) console.error(`- ${item.message}`);
  process.exitCode = 1;
} else {
  assertPoliticalGeographyAuthorityReady(input);
  console.log(`Political Geography Authority ready: ${result.provinceCount} provinces.`);
}
