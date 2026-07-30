export function createProvince(rawProvince) {
  return {
    id: rawProvince.id,

    name: rawProvince.name,

    region: rawProvince.region,

    terrain: rawProvince.terrain,

    city: rawProvince.city,

    owner: rawProvince.owner,

    controller: rawProvince.controller,

    population: rawProvince.population,

    development: rawProvince.development,

    sea: rawProvince.sea,

    river: rawProvince.river,

    port: rawProvince.port,

    fortLevel: rawProvince.fortLevel,

    status: {
      underSiege: false,
      occupied: false,
      looted: false,
    },

    armies: [],
  };
}