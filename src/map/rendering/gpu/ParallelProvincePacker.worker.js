/**
 * Worker thread for parallel province packing.
 *
 * The worker owns the expensive geometry packing operation.  Keep this file
 * deliberately small: the canonical packer remains the single implementation
 * of the packing algorithm, while this worker only supplies its optimized
 * triangulation dependency and transports results across the worker boundary.
 */

import { parentPort, workerData } from "node:worker_threads";
import { buildIndexedProvincePack } from "./ProvinceGpuPackStable.js";
import { triangulateRingOptimized } from "./TriangulationOptimized.js";

const workerIndex = workerData?.workerIndex ?? 0;

parentPort?.on("message", async (message) => {
  if (message?.type !== "PACK_PROVINCES") return;

  try {
    const pack = await buildIndexedProvincePack(message.entries ?? [], {
      ...(message.options ?? {}),
      triangulateRing: triangulateRingOptimized,
    });

    parentPort?.postMessage({
      type: "RESULT",
      pack,
      workerIndex,
    });
  } catch (error) {
    parentPort?.postMessage({
      type: "ERROR",
      error: error instanceof Error ? error.message : String(error),
      workerIndex,
    });
  }
});

parentPort?.postMessage({ type: "READY", workerIndex });
