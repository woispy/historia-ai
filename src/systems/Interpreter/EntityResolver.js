export function resolveEntities(text = "") {
  const value = text.toLowerCase();

  const entities = {};

  if (value.includes("iznik")) {
    entities.city = "iznik";
  }

  if (value.includes("bursa")) {
    entities.city = "bursa";
  }

  if (value.includes("bizans")) {
    entities.country = "byzantium";
  }

  return entities;
}