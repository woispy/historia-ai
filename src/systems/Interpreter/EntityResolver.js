export function resolveEntities(text = "") {
  const value = text.toLowerCase();
  const entities = {};

  const cities = [
    ["konstantinopolis", "konstantinopolis"],
    ["bilecik", "bilecik"],
    ["söğüt", "sogut"],
    ["sogut", "sogut"],
    ["iznik", "iznik"],
    ["bursa", "bursa"],
  ];

  for (const [name, id] of cities) {
    if (value.includes(name)) {
      entities.city = id;
      break;
    }
  }

  if (value.includes("bizans") || value.includes("roma")) {
    entities.country = "byzantium";
  }

  if (value.includes("osmanlı") || value.includes("osmanli")) {
    entities.country = "ottomans";
  }

  return entities;
}
