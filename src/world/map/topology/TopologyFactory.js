import adjacency from "./adjacency.json" with { type: "json" };

export function createTopology() {
  return {
    adjacency,
  };
}
