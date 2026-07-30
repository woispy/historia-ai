export function createDictionary(items) {
  const byId = {};
  const allIds = [];

  for (const item of items) {
    byId[item.id] = item;
    allIds.push(item.id);
  }

  return {
    byId,
    allIds,
  };
}