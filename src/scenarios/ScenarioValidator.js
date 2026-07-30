/**
 * Validates a loaded scenario.
 *
 * This validator is intentionally layered.
 * Each validation step is isolated so new rules
 * can be added without changing existing logic.
 */

/**
 * Creates an empty validation report.
 *
 * @returns {{
 *   valid: boolean,
 *   errors: Array<{code:string,message:string}>,
 *   warnings: Array<{code:string,message:string}>
 * }}
 */
function createValidationReport() {
  return {
    valid: true,
    errors: [],
    warnings: [],
  };
}

function addError(report, code, message) {
  report.valid = false;

  report.errors.push({
    code,
    message,
  });
}

function addWarning(report, code, message) {
  report.warnings.push({
    code,
    message,
  });
}

/**
 * Validates the scenario definition.
 */
function validateDefinition(scenario, report) {
  if (!scenario.id) {
    addError(
      report,
      "SCENARIO_MISSING_ID",
      "Scenario id is required."
    );
  }

  if (!scenario.name) {
    addError(
      report,
      "SCENARIO_MISSING_NAME",
      "Scenario name is required."
    );
  }

  if (!scenario.world) {
    addError(
      report,
      "SCENARIO_MISSING_WORLD",
      "Scenario world is required."
    );
  }

  if (!scenario.startDate) {
    addError(
      report,
      "SCENARIO_MISSING_START_DATE",
      "Scenario start date is required."
    );
  }

  if (!Array.isArray(scenario.resources)) {
    addError(
      report,
      "SCENARIO_INVALID_RESOURCES",
      "Scenario resources must be an array."
    );
  }
}

/**
 * Validates loaded resource collections.
 */
function validateResources(scenario, report) {
  if (!scenario.data) {
    addError(
      report,
      "SCENARIO_MISSING_DATA",
      "Scenario data is missing."
    );
    return;
  }

  for (const resourceName of scenario.resources) {
    const resource = scenario.data[resourceName];

    if (!resource) {
      addError(
        report,
        "RESOURCE_NOT_LOADED",
        `Resource "${resourceName}" was not loaded.`
      );

      continue;
    }

    for (const entity of Object.values(resource)) {
      if (!entity.id) {
        addError(
          report,
          "ENTITY_MISSING_ID",
          `A "${resourceName}" entity is missing its id.`
        );
      }
    }

    if (Object.keys(resource).length === 0) {
      addWarning(
        report,
        "RESOURCE_EMPTY",
        `Resource "${resourceName}" contains no entities.`
      );
    }
  }
}

/**
 * Validates a loaded scenario.
 *
 * Returns a validation report instead of throwing,
 * allowing callers to display every detected issue.
 */
export function validateScenario(scenario) {
  if (!scenario) {
    throw new Error("Scenario is required.");
  }

  const report = createValidationReport();

  validateDefinition(scenario, report);
  validateResources(scenario, report);

  return Object.freeze({
    valid: report.valid,
    errors: Object.freeze([...report.errors]),
    warnings: Object.freeze([...report.warnings]),
  });
}