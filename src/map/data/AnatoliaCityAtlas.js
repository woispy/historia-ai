/**
 * Historia AI — Anatolia city atlas, 1300.
 *
 * Coordinates are WGS84 longitude/latitude. This is cartographic metadata,
 * not mutable city state. Province ids use the Phase 2B historical geography
 * vocabulary so city focus and province presentation share one identity layer.
 */

export const ANATOLIA_CITY_ATLAS = Object.freeze({
  konstantinopolis: { name: "Konstantinopolis", modernName: "İstanbul", x: 28.9784, y: 41.0082, tier: "capital", port: true, fortified: true, mapProvinceId: null },
  edirne: { name: "Adrianopolis", modernName: "Edirne", x: 26.5556, y: 41.6772, tier: "major", port: false, fortified: true, mapProvinceId: null },
  nikomedia: { name: "Nikomedia", modernName: "İzmit", x: 29.9169, y: 40.7654, tier: "major", port: true, fortified: true, mapProvinceId: "bithynia-nicomedia" },
  iznik: { name: "Nikaia", modernName: "İznik", x: 29.7183, y: 40.4286, tier: "major", port: false, fortified: true, mapProvinceId: "bithynia-nicaea" },
  bursa: { name: "Prusa", modernName: "Bursa", x: 29.0611, y: 40.1917, tier: "major", port: false, fortified: true, mapProvinceId: "bithynia-prusa" },
  sogut: { name: "Söğüt", modernName: "Söğüt", x: 30.1733, y: 40.0242, tier: "major", port: false, fortified: true, mapProvinceId: "phrygia-sogut" },
  bilecik: { name: "Bilecik", modernName: "Bilecik", x: 30.1542, y: 40.1501, tier: "major", port: false, fortified: true, mapProvinceId: "phrygia-bilecik" },
  kutahya: { name: "Kütahya", modernName: "Kütahya", x: 29.9833, y: 39.4167, tier: "capital", port: false, fortified: true, mapProvinceId: "phrygia-kutahya" },
  eskisehir: { name: "Dorylaion", modernName: "Eskişehir", x: 30.5256, y: 39.7767, tier: "major", port: false, fortified: true, mapProvinceId: "phrygia-eskisehir" },
  balikesir: { name: "Balıkesir", modernName: "Balıkesir", x: 27.8826, y: 39.6484, tier: "capital", port: false, fortified: true, mapProvinceId: "mysia-balikesir" },
  bergama: { name: "Pergamon", modernName: "Bergama", x: 27.1841, y: 39.1200, tier: "major", port: false, fortified: true, mapProvinceId: "mysia-pergamon" },
  manisa: { name: "Magnesia", modernName: "Manisa", x: 27.4289, y: 38.6191, tier: "capital", port: false, fortified: true, mapProvinceId: "lydia-magnesia" },
  smyrna: { name: "Smyrna", modernName: "İzmir", x: 27.1428, y: 38.4237, tier: "major", port: true, fortified: true, mapProvinceId: "lydia-smyrna" },
  ayasuluk: { name: "Ayasuluk", modernName: "Selçuk", x: 27.3667, y: 37.9500, tier: "major", port: true, fortified: true, mapProvinceId: "ionia-ayasuluk" },
  birgi: { name: "Birgi", modernName: "Birgi", x: 28.0606, y: 38.2500, tier: "capital", port: false, fortified: true, mapProvinceId: "lydia-birgi" },
  aydin: { name: "Tralleis", modernName: "Aydın", x: 27.8416, y: 37.8560, tier: "major", port: false, fortified: true, mapProvinceId: "caria-tralleis" },
  milas: { name: "Mylasa", modernName: "Milas", x: 27.7833, y: 37.3167, tier: "capital", port: false, fortified: true, mapProvinceId: "caria-mylasa" },
  pecin: { name: "Peçin", modernName: "Beçin", x: 27.5700, y: 37.2700, tier: "major", port: false, fortified: true, mapProvinceId: "caria-pecin" },
  halikarnassos: { name: "Halikarnassos", modernName: "Bodrum", x: 27.4305, y: 37.0344, tier: "major", port: true, fortified: true, mapProvinceId: "caria-halikarnassos" },
  denizli: { name: "Lâdik / Denizli", modernName: "Denizli", x: 29.0875, y: 37.7765, tier: "capital", port: false, fortified: true, mapProvinceId: "phrygia-denizli" },
  uluborlu: { name: "Uluborlu", modernName: "Uluborlu", x: 30.4500, y: 38.0833, tier: "capital", port: false, fortified: true, mapProvinceId: "phrygia-uluborlu" },
  egirdir: { name: "Eğirdir", modernName: "Eğirdir", x: 30.8500, y: 37.8740, tier: "major", port: false, fortified: true, mapProvinceId: "pisidia-egirdir" },
  afyon: { name: "Karahisar-ı Sâhib", modernName: "Afyonkarahisar", x: 30.5566, y: 38.7507, tier: "capital", port: false, fortified: true, mapProvinceId: "phrygia-afyon" },
  beysehir: { name: "Beyşehir", modernName: "Beyşehir", x: 31.7244, y: 37.6774, tier: "capital", port: false, fortified: true, mapProvinceId: "pisidia-beysehir" },
  konya: { name: "Konya / Iconium", modernName: "Konya", x: 32.4925, y: 37.8746, tier: "major", port: false, fortified: true, mapProvinceId: "lycaonia-konya" },
  larende: { name: "Larende", modernName: "Karaman", x: 33.2150, y: 37.1811, tier: "capital", port: false, fortified: true, mapProvinceId: "lycaonia-larende" },
  ankara: { name: "Ancyra", modernName: "Ankara", x: 32.8541, y: 39.9208, tier: "major", port: false, fortified: true, mapProvinceId: "galatia-ankara" },
  kayseri: { name: "Caesarea", modernName: "Kayseri", x: 35.4900, y: 38.7200, tier: "major", port: false, fortified: true, mapProvinceId: "cappadocia-kayseri" },
  sivas: { name: "Sebasteia", modernName: "Sivas", x: 37.0167, y: 39.7500, tier: "major", port: false, fortified: true, mapProvinceId: "cappadocia-sivas" },
  kastamonu: { name: "Kastamon", modernName: "Kastamonu", x: 33.7767, y: 41.3781, tier: "capital", port: false, fortified: true, mapProvinceId: "pontus-kastamon" },
  sinop: { name: "Sinope", modernName: "Sinop", x: 35.1550, y: 42.0231, tier: "major", port: true, fortified: true, mapProvinceId: "pontus-sinop" },
  amisos: { name: "Amisos", modernName: "Samsun", x: 36.3300, y: 41.2867, tier: "major", port: true, fortified: true, mapProvinceId: "pontus-amisos" },
  amasya: { name: "Amaseia", modernName: "Amasya", x: 35.8337, y: 40.6530, tier: "major", port: false, fortified: true, mapProvinceId: "pontus-amasya" },
  trabzon: { name: "Trebizond", modernName: "Trabzon", x: 39.7167, y: 41.0010, tier: "capital", port: true, fortified: true, mapProvinceId: "pontus-trebizond" },
  erzincan: { name: "Erzingan", modernName: "Erzincan", x: 39.4900, y: 39.7500, tier: "major", port: false, fortified: true, mapProvinceId: "eastern-anatolia-erzincan" },
  erzurum: { name: "Theodosiopolis", modernName: "Erzurum", x: 41.2769, y: 39.9043, tier: "major", port: false, fortified: true, mapProvinceId: "eastern-anatolia-erzurum" },
  sis: { name: "Sis", modernName: "Kozan", x: 35.8000, y: 37.4500, tier: "capital", port: false, fortified: true, mapProvinceId: "cilicia-sis" },
  tarsus: { name: "Tarsos", modernName: "Tarsus", x: 34.8950, y: 36.9167, tier: "major", port: false, fortified: true, mapProvinceId: "cilicia-tarsos" },
});

export function getAnatoliaCityMapMetadata(cityId) {
  return ANATOLIA_CITY_ATLAS[cityId] ?? null;
}
