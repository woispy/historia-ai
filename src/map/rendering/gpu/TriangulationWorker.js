/**
 * Worker thread for parallel triangulation.
 */

import { isMainThread, parentPort } from "node:worker_threads";
import { triangulateRingOptimized } from "./TriangulationOptimized.js";

if (!isMainThread) {
  parentPort?.on("message", (msg) => {
    if (msg.type !== "TRIANGULATE_BATCH") return;
    const { rings, context } = msg;
    const results = rings.map((ring, index) => {
      try {
        const triangles = triangulateRingOptimized(ring, context);
        return { index, triangles, success: true };
      } catch (error) {
        return { index, error: error.message, success: false };
      }
    });
    parentPort?.postMessage({ type: "RESULT", taskId: msg.taskId, results });
  });
}
