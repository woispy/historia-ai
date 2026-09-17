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

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("en-US");
}

function sourceMatchesForRule(rule) {
  return Array.isArray(rule.sourceMatches) ? rule.sourceMatches : [];
}

function matchesRule(candidate, rule) {
  for (const sourceMatch of sourceMatchesForRule(rule)) {
    if (sourceMatch.wikidataId && candidate.wikidataId === sourceMatch.wikidataId) return "wikidata";
    if (sourceMatch.seshatId && candidate.seshatId === sourceMatch.seshatId) return "seshat";
  }

  for (const sourceMatch of sourceMatchesForRule(rule)) {
    const aliases = Array.isArray(sourceMatch.names) ? sourceMatch.names : [];
    if (aliases.some((alias) => normalize(alias) === normalize(candidate.name))) return "name";
  }

  return null;
}

export function reconcileHistoricalEntities(candidates, rules) {
  assertCandidates(candidates);
  assertRules(rules);

  const ruleValidation = validateReconciliationRules(rules);
  if (!ruleValidation.valid) {
    throw new Error(
      `Invalid reconciliation rules: ${ruleValidation.errors.map((error) => error.reason).join("; ")}`,
    );
  }

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
        candidateName: candidate.name,
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

    if (!Array.isArray(rule.sourceMatches)) {
      errors.push({ index, reason: "sourceMatches must be an array." });
    }

    if (
      rule.confidence !== undefined &&
      (!Number.isFinite(rule.confidence) || rule.confidence < 0 || rule.confidence > 1)
    ) {
      errors.push({ index, reason: "confidence must be between 0 and 1." });
    }

    for (const [matchIndex, sourceMatch] of sourceMatchesForRule(rule).entries()) {
      if (!sourceMatch || typeof sourceMatch.sourceId !== "string" || !sourceMatch.sourceId.trim()) {
        errors.push({ index, reason: `sourceMatches[${matchIndex}].sourceId is required.` });
      }
      if (sourceMatch.matchStatus !== "candidate" && sourceMatch.matchStatus !== "reviewed") {
        errors.push({
          index,
          reason: `sourceMatches[${matchIndex}].matchStatus must be candidate or reviewed.`,
        });
      }
      if (!Array.isArray(sourceMatch.names)) {
        errors.push({ index, reason: `sourceMatches[${matchIndex}].names must be an array.` });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
