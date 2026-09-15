/**
 * Historia AI — Visual Regression Test Infrastructure
 *
 * Renders map frames and compares against baseline images to detect
 * visual regressions in rendering. Uses pixel-perfect comparison with
 * configurable tolerance for acceptable differences.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_DIR = join(__dirname, "..", "..", "visual-baselines");
const DIFF_DIR = join(__dirname, "..", "..", "visual-diffs");

/**
 * Configuration for visual regression tests
 */
const VisualRegressionConfig = {
  // Threshold for pixel difference (0-255 per channel)
  pixelThreshold: 2,
  // Maximum percentage of different pixels allowed
  maxDiffPercent: 0.1,
  // Whether to update baselines automatically
  updateBaselines: false,
};

/**
 * Pixel comparison result
 */
export class DiffResult {
  constructor(totalPixels, differentPixels, maxDiff) {
    this.totalPixels = totalPixels;
    this.differentPixels = differentPixels;
    this.maxDiff = maxDiff;
    this.diffPercent = (differentPixels / totalPixels) * 100;
    this.passed = this.diffPercent <= VisualRegressionConfig.maxDiffPercent &&
                   maxDiff <= VisualRegressionConfig.pixelThreshold;
  }
}

/**
 * Compare two RGBA images (Uint8Array) pixel by pixel
 */
function compareImages(baseline, current, width, height) {
  if (baseline.length !== current.length) {
    throw new Error(`Image size mismatch: baseline ${baseline.length} vs current ${current.length}`);
  }

  let differentPixels = 0;
  let maxDiff = 0;
  const totalPixels = width * height;

  for (let i = 0; i < baseline.length; i += 4) {
    const rDiff = Math.abs(baseline[i] - current[i]);
    const gDiff = Math.abs(baseline[i + 1] - current[i + 1]);
    const bDiff = Math.abs(baseline[i + 2] - current[i + 2]);
    const aDiff = Math.abs(baseline[i + 3] - current[i + 3]);

    const pixelDiff = Math.max(rDiff, gDiff, bDiff, aDiff);
    maxDiff = Math.max(maxDiff, pixelDiff);

    if (pixelDiff > 0) {
      differentPixels++;
    }
  }

  return new DiffResult(totalPixels, differentPixels, maxDiff);
}

/**
 * Save image data as PNG (for debugging/baseline generation)
 * Note: This is a simplified implementation. In production, use a proper PNG library.
 */
function saveImageRGBA(data, width, height, filepath) {
  // Simple PPM format for now (easy to read, no dependencies)
  const ppmHeader = `P6\n${width} ${height}\n255\n`;
  const rgbData = new Uint8Array(data.length / 4 * 3);

  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    rgbData[j] = data[i];
    rgbData[j + 1] = data[i + 1];
    rgbData[j + 2] = data[i + 2];
  }

  const buffer = Buffer.concat([
    Buffer.from(ppmHeader),
    Buffer.from(rgbData),
  ]);

  writeFileSync(filepath, buffer);
}

/**
 * Load image from PPM file (for baselines)
 */
function loadImageRGBA(filepath, width, height) {
  const buffer = readFileSync(filepath);
  // Skip PPM header
  const headerEnd = buffer.indexOf("\n", buffer.indexOf("\n", buffer.indexOf("\n") + 1) + 1) + 1;
  const rgbData = buffer.slice(headerEnd);

  const rgbaData = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < rgbData.length; i += 3, j += 4) {
    rgbaData[j] = rgbData[i];
    rgbaData[j + 1] = rgbData[i + 1];
    rgbaData[j + 2] = rgbData[i + 2];
    rgbaData[j + 3] = 255;
  }

  return rgbaData;
}

/**
 * Visual regression test runner
 */
class VisualRegressionTester {
  constructor(options = {}) {
    this.config = { ...VisualRegressionConfig, ...options };
    this.baselineDir = options.baselineDir || BASELINE_DIR;
    this.diffDir = options.diffDir || DIFF_DIR;

    if (!existsSync(this.baselineDir)) {
      mkdirSync(this.baselineDir, { recursive: true });
    }
    if (!existsSync(this.diffDir)) {
      mkdirSync(this.diffDir, { recursive: true });
    }
  }

  /**
   * Run a visual regression test
   */
  async test(name, renderFn, width, height) {
    const baselinePath = join(this.baselineDir, `${name}.ppm`);
    const currentPath = join(this.diffDir, `${name}-current.ppm`);
    const diffPath = join(this.diffDir, `${name}-diff.ppm`);

    // Render current frame
    const currentImage = await renderFn(width, height);
    saveImageRGBA(currentImage, width, height, currentPath);

    // Check if baseline exists
    if (!existsSync(baselinePath)) {
      if (this.config.updateBaselines) {
        saveImageRGBA(await renderFn(width, height), width, height, baselinePath);
        return { passed: true, baselineCreated: true };
      }
      return { passed: false, reason: "No baseline exists" };
    }

    // Load baseline
    const baseline = loadImageRGBA(baselinePath, width, height);

    // Get current image data
    const current = new Uint8Array(width * height * 4);
    // Assume renderFn returns Uint8Array RGBA
    const currentData = await renderFn(width, height);

    // Compare
    const result = compareImages(
      new Uint8Array(baseline),
      new Uint8Array(currentData),
      width, height
    );

    if (!result.passed) {
      // Generate diff image
      const diffData = new Uint8Array(width * height * 4);
      // Generate diff visualization (red for differences)
      // Simplified for now

      return {
        passed: false,
        result,
        currentPath,
        baselinePath,
        diffPath,
      };
    }

    return { passed: true };
  }
}

/**
 * Helper to create a test that captures a frame and compares to baseline
 */
function createVisualRegressionTest(name, renderFn, width, height, options = {}) {
  const tester = new VisualRegressionTester(options);

  return async function visualRegressionTest() {
    const result = await tester.test(name, renderFn, width, height);

    if (!result.passed) {
      throw new Error(
        `Visual regression detected in ${name}: ${result.result.diffPercent.toFixed(2)}% pixels differ (max diff: ${result.result.maxDiff})`
      );
    }

    return result;
  };
}

/**
 * Snapshot testing for non-visual data (JSON, etc.)
 */
function snapshotTest(name, data, options = {}) {
  const baselineDir = options.baselineDir || join(__dirname, "..", "..", "snapshots");
  const baselinePath = join(baselineDir, `${name}.json`);

  const current = JSON.stringify(data, null, 2);

  if (!existsSync(baselinePath)) {
    if (options.updateSnapshots) {
      writeFileSync(baselinePath, current);
      return { passed: true, snapshotCreated: true };
    }
    return { passed: false, reason: "No baseline snapshot exists" };
  }

  const baseline = readFileSync(baselinePath, "utf8");

  if (baseline !== current) {
    return {
      passed: false,
      diff: { expected: baseline, actual: current }
    };
  }

  return { passed: true, snapshotCreated: true };
}

export { VisualRegressionConfig, compareImages, saveImageRGBA, loadImageRGBA, VisualRegressionTester, createVisualRegressionTest, snapshotTest };
