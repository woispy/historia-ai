/**
 * Historia AI — Parallel Triangulation Pool
 *
 * Worker-thread based parallel triangulation for 15K+ province scale.
 * Distributes triangulation work across worker threads.
 */

import { Worker, isMainThread, parentPort } from "node:worker_threads";
import { cpus } from "node:os";
import { triangulateRingOptimized } from "./TriangulationOptimized.js";

const DEFAULT_WORKER_COUNT = Math.max(1, cpus() - 1);

// Worker thread entry point
if (!isMainThread) {
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
} else {
  // Main thread class
  export class ParallelTriangulator {
    constructor(options = {}) {
      this.workerCount = options.workerCount ?? Math.max(1, require("os").cpus().length - 1);
      this.workers = [];
      this.initialized = false;
    }

    async initialize() {
      if (this.initialized) return;

      const workerPath = new URL("./ParallelTriangulator.js", import.meta.url);
      const workerCount = Math.max(1, require("os").cpus().length - 1);

      for (let i = 0; i < this.workerCount; i++) {
        const worker = new Worker(new URL("./ParallelTriangulator.js", import.meta.url), {
          workerData: { workerIndex: i },
          type: "module",
        });

        worker.on("error", (err) => console.error(`Triangulation worker error:`, err));
        worker.on("exit", (code) => {
          if (code !== 0) console.error(`Triangulation worker exited with code ${code}`);
        });

        this.workers.push(worker);
      }

      // Wait for workers to be ready
      await Promise.all(this.workers.map(w => new Promise(resolve => {
        w.once("message", msg => { if (msg.type === "READY") resolve(); });
        setTimeout(resolve, 100);
      })));

      this.initialized = true;
    }

    /**
     * Triangulate multiple rings in parallel
     * @param {Array<Array<number[]>>} rings - Array of rings (each ring is [lon, lat][])
     * @param {Object} context - Context for triangulation (provinceId, etc.)
     * @returns {Array<Uint32Array>} Array of triangle index arrays
     */
    async triangulateBatch(rings, context = {}) {
      if (!this.workers.length) await this.initialize();

      const chunkSize = Math.ceil(rings.length / this.workers.length);
      const chunks = [];
      for (let i = 0; i < rings.length; i += chunkSize) {
        chunks.push(rings.slice(i, i + chunkSize));
      }

      const promises = chunks.map((chunk, index) => {
        const worker = this.workers[index % this.workers.length];
        const taskId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        return new Promise((resolve, reject) => {
          const handler = (msg) => {
            if (msg.type === "RESULT" && msg.taskId === taskId) {
              worker.off("message", handler);
              const sorted = msg.results.sort((a, b) => a.index - b.index);
              resolve(sorted.map(r => r.success ? r.triangles : null));
            } else if (msg.type === "ERROR") {
              worker.off("message", handler);
              reject(new Error(msg.error));
            }
          };

          worker.on("message", handler);
          worker.postMessage({
            type: "TRIANGULATE_BATCH",
            taskId,
            rings: chunk,
            context,
          });
        });
      });

      const results = await Promise.all(promises);
      return results.flat();
    }

    terminate() {
      for (const worker of this.workers) {
        worker.terminate();
      }
      this.workers = [];
    }
  }

  // Worker thread entry point
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
      });
    }
  }
