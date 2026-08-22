import assert from "node:assert/strict";
import test from "node:test";

import { createHydrographyRegionLoader } from "../../src/map/physical/HydrographyRegionLoader.js";

function response(value, ok = true, status = 200) {
  return {
    ok,
    status,
    async json() {
      return value;
    },
  };
}

test("loads a region lazily and caches it", async () => {
  const calls = [];
  const loader = createHydrographyRegionLoader({
    manifestUrl: "/manifest.json",
    fetchImpl: async (url) => {
      calls.push(url);
      if (url === "/manifest.json") {
        return response({ regions: [{ id: "00-00", asset: "/00-00.json" }] });
      }
      return response({ rivers: [{ id: "river-1" }], lakes: [] });
    },
  });

  const first = await loader.loadRegion("00-00");
  const second = await loader.loadRegion("00-00");

  assert.deepEqual(first, second);
  assert.deepEqual(calls, ["/manifest.json", "/00-00.json"]);
});

test("deduplicates region requests and bounds the cache", async () => {
  const calls = [];
  const loader = createHydrographyRegionLoader({
    manifestUrl: "/manifest.json",
    maxCachedRegions: 1,
    fetchImpl: async (url) => {
      calls.push(url);
      if (url === "/manifest.json") {
        return response({
          regions: [
            { id: "a", asset: "/a.json" },
            { id: "b", asset: "/b.json" },
          ],
        });
      }
      return response({ rivers: [{ id: url }], lakes: [] });
    },
  });

  const [a, duplicateA] = await loader.loadRegions(["a", "a"]);
  assert.equal(a.rivers[0].id, duplicateA.rivers[0].id);
  await loader.loadRegion("b");
  await loader.loadRegion("a");

  assert.deepEqual(calls, ["/manifest.json", "/a.json", "/b.json", "/a.json"]);
});

test("rejects an unknown region without a network request for an asset", async () => {
  const calls = [];
  const loader = createHydrographyRegionLoader({
    fetchImpl: async (url) => {
      calls.push(url);
      return response({ regions: [{ id: "known", asset: "/known.json" }] });
    },
  });

  await assert.rejects(() => loader.loadRegion("missing"), /Unknown hydrography region/);
  assert.deepEqual(calls, ["/assets/hydrography-regions/manifest.json"]);
});

test("rejects failed manifest and asset responses", async () => {
  const manifestLoader = createHydrographyRegionLoader({
    fetchImpl: async () => response({}, false, 503),
  });
  await assert.rejects(() => manifestLoader.loadManifest(), /503/);

  const assetLoader = createHydrographyRegionLoader({
    fetchImpl: async (url) => {
      if (url.endsWith("manifest.json")) return response({ regions: [{ id: "a", asset: "/a.json" }] });
      return response({}, false, 404);
    },
  });
  await assert.rejects(() => assetLoader.loadRegion("a"), /404/);
});
