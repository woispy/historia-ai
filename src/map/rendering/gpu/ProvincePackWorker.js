/**
 * Historia AI — Province Pack Worker
 *
 * Worker-thread entry point. Runs the ORIGINAL buildIndexedProvincePack on a
 * chunk of province entries. No behavior changes: this is the exact same
 * deterministic packer the sequential pipeline uses, just executed in a
 * worker so chunks can be processed concurrently.
 */

import { parentPort, workerData } from "node:worker_threads";
import { buildIndexedProvincePack } from "./ProvinceGpuPackStable.js";

const { entries, options } = workerData;

try {
  const pack = buildIndexedProvincePack(entries, options ?? {});
  parentPort.postMessage({ type: "result", pack });
} catch (error) {
  parentPort.postMessage({ type: "error", message: error?.message ?? String(error) });
}
