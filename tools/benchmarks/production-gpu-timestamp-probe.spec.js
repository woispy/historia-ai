import { test } from "@playwright/test";

const probeUrl = "/benchmarks/production-gpu-timestamp-probe.html";

test("Historia AI production-like GPU timestamp regression probe", async ({ page }) => {
  await page.goto(probeUrl, { waitUntil: "load" });
  await page.waitForFunction(() => document.body.textContent && document.body.textContent.trim().startsWith("{"), null, { timeout: 30000 });
  const result = await page.evaluate(() => JSON.parse(document.body.textContent));

  console.log(`HISTORIA_PRODUCTION_GPU_TIMESTAMP ${JSON.stringify(result)}`);
  test.info().annotations.push({ type: "gpu-production-timestamp", description: JSON.stringify(result) });

  if (!result.supported) throw new Error(`Production-like GPU timestamp probe unavailable: ${result.error || "unknown reason"}`);
  if (result.error) throw new Error(`Production-like GPU timestamp probe failed: ${result.error}`);

  const cases = ["computeThenTimestampThenRender", "computeThenRenderThenTimestamp"];
  for (const name of cases) {
    const snapshot = result.cases?.[name];
    if (!snapshot) throw new Error(`Production-like timestamp probe missing case: ${name}`);
    if (snapshot.timestampSamplesZero !== 0 || snapshot.timestampSamplesDropped !== 0) {
      throw new Error(`Production-like timestamp case ${name} had invalid samples: zero=${snapshot.timestampSamplesZero}, dropped=${snapshot.timestampSamplesDropped}`);
    }
    if (!(snapshot.gpuTimeMs?.count > 0) || !(snapshot.gpuTimeMs?.average > 0)) {
      throw new Error(`Production-like timestamp case ${name} returned no positive GPU time`);
    }
  }
});
