/**
 * Historia AI — Parallel Triangulation Pool
 *
 * Worker-thread based parallel triangulation for build-time GPU packing.
 * The worker protocol is deterministic: input order is preserved in the result.
 */

import { Worker, isMainThread, parentPort } from "node:worker_threads";
import { cpus } from "node:os";
import { triangulateRingOptimized } from "./TriangulationOptimized.js";

const DEFAULT_WORKER_COUNT = Math.max(1, cpus().length - 1);

if (!isMainThread) {
  parentPort?.postMessage({ type: "READY" });

  parentPort?.on("message", (message) => {
    if (message?.type !== "TRIANGULATE_BATCH") return;

    const { taskId, rings, context } = message;
    const results = rings.map((ring, index) => {
      try {
        return {
          index,
          triangles: triangulateRingOptimized(ring, context),
          success: true,
        };
      } catch (error) {
        return {
          index,
          error: error instanceof Error ? error.message : String(error),
          success: false,
        };
      }
    });

    parentPort?.postMessage({ type: "RESULT", taskId, results });
  });
}

export class ParallelTriangulator {
  constructor(options = {}) {
    const requested = Number(options.workerCount);
    this.workerCount = Number.isInteger(requested) && requested > 0
      ? requested
      : DEFAULT_WORKER_COUNT;
    this.workers = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    for (let index = 0; index < this.workerCount; index += 1) {
      const worker = new Worker(new URL("./ParallelTriangulator.js", import.meta.url), {
        type: "module",
      });
      this.workers.push(worker);
    }

    await Promise.all(this.workers.map((worker) => new Promise((resolve, reject) => {
      const onReady = (message) => {
        if (message?.type !== "READY") return;
        cleanup();
        resolve();
      };
      const onError = (error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        worker.off("message", onReady);
        worker.off("error", onError);
      };

      worker.on("message", onReady);
      worker.once("error", onError);
    })));

    this.initialized = true;
  }

  async triangulateBatch(rings, context = {}) {
    if (!Array.isArray(rings) || rings.length === 0) return [];
    if (!this.workers.length) await this.initialize();

    const workerCount = Math.min(this.workers.length, rings.length);
    const chunkSize = Math.ceil(rings.length / workerCount);
    const promises = [];

    for (let start = 0, workerIndex = 0; start < rings.length; start += chunkSize, workerIndex += 1) {
      const chunk = rings.slice(start, start + chunkSize);
      const worker = this.workers[workerIndex % this.workers.length];
      const taskId = `${start}:${chunk.length}`;

      promises.push(new Promise((resolve, reject) => {
        const onMessage = (message) => {
          if (message?.type !== "RESULT" || message.taskId !== taskId) return;
          cleanup();
          const sorted = [...message.results].sort((a, b) => a.index - b.index);
          resolve(sorted.map((result) => result.success ? result.triangles : null));
        };
        const onError = (error) => {
          cleanup();
          reject(error);
        };
        const cleanup = () => {
          worker.off("message", onMessage);
          worker.off("error", onError);
        };

        worker.on("message", onMessage);
        worker.once("error", onError);
        worker.postMessage({ type: "TRIANGULATE_BATCH", taskId, rings: chunk, context });
      }));
    }

    const results = await Promise.all(promises);
    return results.flat();
  }

  async terminate() {
    const workers = this.workers;
    this.workers = [];
    this.initialized = false;
    await Promise.all(workers.map((worker) => worker.terminate()));
  }
}
