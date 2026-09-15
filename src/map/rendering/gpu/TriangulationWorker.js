/**
 * Worker thread for parallel triangulation
 */

import { parentPort, workerData } from "node:worker_threads";

if (!require("node:worker_threads").isMainThread) {
  const { triangulateRingOptimized } = await import("./TriangulationOptimized.js");

  parentPort?.on("message", (msg) => {
    if (msg.type === "TRIANGULATE_BATCH") {
      const { taskId, rings, context } = msg;

      const results = rings.map((ring, index) => {
        try {
          const triangles = triangulateRingOptimized(ring, context);
          return { index, triangles, success: true };
        } catch (error) {
          return { index, error: error.message, success: false };
        }
      });

      parentPort?.postMessage({ type: "RESULT", taskId: msg.taskId, results });
    }
  });
}
