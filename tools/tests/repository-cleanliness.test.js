import { execFileSync } from "node:child_process";

const status = execFileSync(
  "git",
  ["status", "--porcelain", "--untracked-files=all"],
  { encoding: "utf8" },
).trim();

if (status) {
  console.error("Repository cleanliness check failed. Build-generated or unexpected changes remain:");
  console.error(status);
  process.exit(1);
}

console.log("Repository cleanliness check passed: no tracked or untracked build artifacts remain.");
