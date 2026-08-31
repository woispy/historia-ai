export const MAP_RENDER_PASSES = Object.freeze([
  { id: 0, name: "background-ocean", domain: "water", mask: "physical" },
  { id: 1, name: "physical-land", domain: "physical", mask: "physical" },
  { id: 2, name: "terrain", domain: "terrain", mask: "physical" },
  { id: 3, name: "political-province", domain: "political", mask: "physical" },
  { id: 4, name: "province-borders", domain: "political-border", mask: "physical" },
  { id: 5, name: "rivers", domain: "water", mask: "physical" },
  { id: 6, name: "lakes", domain: "water", mask: "physical" },
  { id: 7, name: "coastline", domain: "water", mask: "physical" },
  { id: 8, name: "fog", domain: "atmosphere", mask: "physical" },
  { id: 9, name: "cities", domain: "cities", mask: "physical" },
  { id: 10, name: "labels", domain: "labels", mask: "physical" },
]);

export const PHYSICAL_MASK_CONTRACT = Object.freeze({
  version: 1,
  channels: Object.freeze({
    land: "r",
    lake: "g",
    sea: "b",
    valid: "a",
  }),
  rule: "Every map render pass samples the same physical mask before writing a pixel.",
});

export function getRenderPass(id) {
  return MAP_RENDER_PASSES.find((pass) => pass.id === id) ?? null;
}

export function assertPhysicalMaskPass(pass) {
  if (!pass || pass.mask !== "physical") {
    throw new Error(`Map render pass ${pass?.name ?? "unknown"} violates the physical-mask contract.`);
  }
  return pass;
}
