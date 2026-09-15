function assertCandidates(candidates) {
  if (!Array.isArray(candidates)) {
    throw new Error("candidates must be an array.");
  }
}

function assertRules(rules) {
  if (!Array.isArray(rules)) {
    throw new Error("reconciliation rules must be an array.");
  }
}

function matchesRule(candidate, rule) {
  if (rule.wikidataId && candidate.wikidataId === rule.wikidataId) return "wikidata";
  if (rule.seshatId && candidate.seshatId === rule.seshatId) return "seshat";

  const normalizedName = candidate.name.trim().toLocaleLowerCase("en-US");
  const aliases = Array.isArray(rule.aliases) ? rule.aliases : [];
  if (aliases.some((alias) => String(alias).trim().toLocaleLowerCase("en-US") === normalizedName)) {
    return "name";
  }

  return null;
}

export function reconcileHistoricalEntities(candidates, rules) {
  assertCandidates(candidates);
  assertRules(rules);

  const reconciled = [];
  const unresolved = [];
  const ambiguous = [];

  for (const candidate of candidates) {
    const matches = rules
      .map((rule) => ({ rule, method: matchesRule(candidate, rule) }))
      .filter(({ method }) => method !== null);

    if (matches.length === 0) {
      unresolved.push({
        sourceFeatureId: candidate.sourceFeatureId,
        reason: "No reconciliation rule matched the source candidate.",
      });
      continue;
    }

    if (matches.length > 1) {
      ambiguous.push({
        sourceFeatureId: candidate.sourceFeatureId,
        candidateName: candidate.name,
        entityIds: matches.map(({ rule }) => rule.entityId),
        reason: "Multiple canonical entities matched the same source candidate.",
      });
      continue;
    }

    const [{ rule, method }] = matches;
    reconciled.push({
      sourceFeatureId: candidate.sourceFeatureId,
      sourceName: candidate.name,
      canonicalEntityId: rule.entityId,
      matchMethod: method,
      confidence: rule.confidence ?? null,
      sourceIdentity: {
        wikidataId: candidate.wikidataId,
        seshatId: candidate.seshatId,
      },
    });
  }

  return {
    reconciled,
    unresolved,
    ambiguous,
    promotion: {
      status: "not-promoted",
      reason: "Entity reconciliation establishes identity only; it does not promote geometry or political control.",
    },
  };
}

export function validateReconciliationRules(rules) {
  assertRules(rules);

  const errors = [];
  const seenEntityIds = new Set();

  for (const [index, rule] of rules.entries()) {
    if (!rule || typeof rule.entityId !== "string" || !rule.entityId.trim()) {
      errors.push({ index, reason: "entityId is required." });
      continue;
    }

    if (seenEntityIds.has(rule.entityId)) {
      errors.push({ index, reason: `Duplicate canonical entityId: ${rule.entityId}.` });
    }
    seenEntityIds.add(rule.entityId);

    if (
      rule.confidence !== undefined &&
      (!Number.isFinite(rule.confidence) || rule.confidence < 0 || rule.confidence > 1)
    ) {
      errors.push({ index, reason: "confidence must be between 0 and 1." });
    }
  }

  return { valid: errors.length === 0, errors };
}
