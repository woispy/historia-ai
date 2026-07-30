/**
 * Loads every JSON file inside a scenario resource folder.
 *
 * Example:
 *
 * data/scenarios/1300/countries/*.json
 * data/scenarios/1300/cities/*.json
 */

const resourceFiles = import.meta.glob(
  "../../data/scenarios/*/*/*.json",
  {
    eager: true,
    import: "default",
  }
);

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

  const result = {};

  for (const [path, data] of Object.entries(resourceFiles)) {
    const expectedFolder = `/data/scenarios/${scenarioId}/${resourceName}/`;

    if (!path.includes(expectedFolder)) {
      continue;
    }

    if (!data.id) {
      throw new Error(`Missing entity id in "${path}".`);
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