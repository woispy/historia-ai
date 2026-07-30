export function createBilecik() {
  return {
    id: "bilecik",

    name: "Bilecik",

    owner: "ottomans",

    population: 5000,

    prosperity: 50,

    food: 75,

    loyalty: 85,

    buildings: [],

    garrison: [],

    status: {
      underSiege: false,
    },
  };
}