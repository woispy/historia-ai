/**
 * Loads scenario JSON resources in both Vite/browser and native Node ESM.
 *
 * Browser builds use Vite's import.meta.glob transform.
 * Native runtime tests use Node 22's process.getBuiltinModule so the
 * executable GameEngine never depends on a Vite-only API.
 */

const viteResourceFiles =
  typeof import.meta.glob === "function"
    ? import.meta.glob(
        "../../data/scenarios/*/*/*.json",
        {
          eager: true,
          import: "default",
        }
      )
    : null;

const nodeFs =
  typeof process !== "undefined" &&
  typeof process.getBuiltinModule === "function"
    ? process.getBuiltinModule("fs")
    : null;

function loadNodeResourceFolder(scenarioId, resourceName) {
  if (!nodeFs) {
    return {};
  }

  const folderUrl = new URL(
    `../../data/scenarios/${scenarioId}/${resourceName}/`,
    import.meta.url
  );

  if (!nodeFs.existsSync(folderUrl)) {
    return {};
  }

  const result = {};

  for (const entry of nodeFs.readdirSync(folderUrl, {
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const fileUrl = new URL(entry.name, folderUrl);
    const data = JSON.parse(
      nodeFs.readFileSync(fileUrl, "utf8")
    );

    if (!data.id) {
      throw new Error(`Missing entity id in "${fileUrl.href}".`);
    }

    if (result[data.id]) {
      throw new Error(
        `Duplicate "${resourceName}" id "${data.id}".`
      );
    }

    result[data.id] = Object.freeze(data);
  }

  return result;
}

/**
 * Loads all entities from a resource folder.
 *
 * @param {string} scenarioId
 * @param {string} resourceName
 * @returns {Object<string, Object>}
 */
export function loadResourceFolder(scenarioId, resourceName) {
  if (!scenarioId) {
    throw new Error("Scenario id is required.");
  }

  if (!resourceName) {
    throw new Error("Resource name is required.");
  }

  if (!viteResourceFiles) {
    return Object.freeze(
      loadNodeResourceFolder(
        scenarioId,
        resourceName
      )
    );
  }

  const result = {};
  const expectedFolder = `/data/scenarios/${scenarioId}/${resourceName}/`;

  for (const [resourcePath, data] of Object.entries(viteResourceFiles)) {
    if (!resourcePath.includes(expectedFolder)) {
      continue;
    }

    if (!data.id) {
      throw new Error(
        `Missing entity id in "${resourcePath}".`
      );
    }

    if (result[data.id]) {
      throw new Error(
        `Duplicate "${resourceName}" id "${data.id}".`
      );
    }

    result[data.id] = Object.freeze(data);
  }

  return Object.freeze(result);
}
