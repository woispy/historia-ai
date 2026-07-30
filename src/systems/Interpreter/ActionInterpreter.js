import { resolveIntent } from "./IntentResolver";
import { resolveEntities } from "./EntityResolver";

export function interpretAction(text) {
  const intent = resolveIntent(text);

  const entities = resolveEntities(text);

  return {
    raw: text,

    intent,

    entities,
  };
}