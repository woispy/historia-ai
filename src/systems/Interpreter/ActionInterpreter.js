import { resolveIntent } from "./IntentResolver.js";
import { resolveEntities } from "./EntityResolver.js";

export function interpretAction(text) {
  const intent = resolveIntent(text);
  const entities = resolveEntities(text);

  return {
    raw: text,
    intent,
    entities,
  };
}
