/**
 * Historia AI — 1300 Anatolia province presentation metadata.
 *
 * A province is a gameplay geography unit. Ownership is intentionally stored
 * separately, because a province survives conquest. These anchors are used to
 * seed the visual hierarchy and later settlement/economy systems; they are not
 * claims of exact medieval administrative districts.
 */

const province = (id, name, cityId, countryId, centroid, options = {}) => ({
  id,
  name,
  cityId,
  countryId,
  centroid,
  coastal: false,
  terrain: "plains",
  borderConfidence: "medium",
  strategic: false,
  port: false,
  ...options,
});

export const ANATOLIA_PROVINCE_METADATA = Object.freeze([
  province("bithynia-nicomedia", "Nicomedia", "nikomedia", "byzantium", [29.92, 40.77], { coastal: true, port: true, terrain: "coast", strategic: true }),
  province("bithynia-nicaea", "Nicaea", "iznik", "byzantium", [29.72, 40.43], { terrain: "lake", strategic: true }),
  province("bithynia-prusa", "Prusa", "bursa", "byzantium", [29.06, 40.19], { terrain: "mountain", strategic: true }),
  province("bithynia-sangarios", "Sangarios Frontier", "eskisehir", "ottomans", [30.52, 40.00], { terrain: "river-valley", strategic: true, borderConfidence: "low" }),
  province("phrygia-sogut", "Söğüt Frontier", "sogut", "ottomans", [30.17, 40.02], { terrain: "highland", strategic: true, borderConfidence: "low" }),
  province("phrygia-bilecik", "Bilecik", "bilecik", "ottomans", [30.15, 40.15], { terrain: "highland", strategic: true, borderConfidence: "low" }),
  province("mysia-balikesir", "Balıkesir", "balikesir", "karasi", [27.88, 39.65], { coastal: true, terrain: "lowland", strategic: true, borderConfidence: "medium" }),
  province("mysia-pergamon", "Pergamon", "bergama", "karasi", [27.18, 39.12], { coastal: true, terrain: "lowland", borderConfidence: "medium" }),
  province("lydia-magnesia", "Magnesia", "manisa", "saruhan", [27.43, 38.62], { terrain: "lowland", strategic: true, borderConfidence: "low" }),
  province("lydia-smyrna", "Smyrna", "smyrna", "saruhan", [27.14, 38.42], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "low" }),
  province("ionia-ayasuluk", "Ayasuluk", "ayasuluk", "aydin", [27.37, 37.95], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "low" }),
  province("lydia-birgi", "Birgi", "birgi", "aydin", [28.06, 38.25], { terrain: "valley", strategic: true, borderConfidence: "low" }),
  province("caria-tralleis", "Tralleis", "aydin", "aydin", [27.84, 37.86], { terrain: "lowland", borderConfidence: "low" }),
  province("caria-mylasa", "Mylasa", "milas", "mentese", [27.78, 37.32], { coastal: true, terrain: "coast", strategic: true, borderConfidence: "medium" }),
  province("caria-pecin", "Peçin", "pecin", "mentese", [27.57, 37.27], { terrain: "coast", strategic: true, borderConfidence: "medium" }),
  province("caria-halikarnassos", "Halikarnassos", "halikarnassos", "mentese", [27.43, 37.03], { coastal: true, port: true, terrain: "coast", borderConfidence: "medium" }),
  province("phrygia-denizli", "Lâdik", "denizli", "inanc", [29.09, 37.78], { terrain: "valley", strategic: true, borderConfidence: "low" }),
  province("phrygia-uluborlu", "Uluborlu", "uluborlu", "hamid", [30.45, 38.08], { terrain: "highland", strategic: true, borderConfidence: "low" }),
  province("pisidia-egirdir", "Eğirdir", "egirdir", "hamid", [30.85, 37.87], { terrain: "lake", strategic: true, borderConfidence: "low" }),
  province("phrygia-afyon", "Karahisar-ı Sâhib", "afyon", "sahibata", [30.56, 38.75], { terrain: "highland", strategic: true, borderConfidence: "low" }),
  province("pisidia-beysehir", "Beyşehir", "beysehir", "esref", [31.72, 37.68], { terrain: "lake", strategic: true, borderConfidence: "low" }),
  province("phrygia-kutahya", "Kütahya", "kutahya", "germiyan", [29.98, 39.42], { terrain: "highland", strategic: true, borderConfidence: "medium" }),
  province("phrygia-eskisehir", "Dorylaion", "eskisehir", "ottomans", [30.53, 39.78], { terrain: "river-valley", strategic: true, borderConfidence: "low" }),
  province("galatia-ankara", "Ancyra", "ankara", "ilkhanate", [32.85, 39.92], { terrain: "plateau", strategic: true, borderConfidence: "medium" }),
  province("cappadocia-kayseri", "Caesarea", "kayseri", "ilkhanate", [35.49, 38.72], { terrain: "plateau", strategic: true, borderConfidence: "medium" }),
  province("pontus-sinop", "Sinope", "sinop", "candar", [35.16, 42.02], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "medium" }),
  province("pontus-amisos", "Amisos", "amisos", "candar", [36.33, 41.29], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "medium" }),
  province("pontus-amasya", "Amaseia", "amasya", "candar", [35.83, 40.65], { terrain: "river-valley", strategic: true, borderConfidence: "medium" }),
  province("pontus-kastamon", "Kastamon", "kastamonu", "candar", [33.78, 41.38], { terrain: "mountain", strategic: true, borderConfidence: "low" }),
  province("pontus-trebizond", "Trebizond", "trabzon", "trebizond", [39.72, 41.00], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "medium" }),
  province("cappadocia-sivas", "Sebasteia", "sivas", "ilkhanate", [37.02, 39.75], { terrain: "plateau", strategic: true, borderConfidence: "medium" }),
  province("eastern-anatolia-erzincan", "Erzingan", "erzincan", "ilkhanate", [39.49, 39.75], { terrain: "highland", strategic: true, borderConfidence: "medium" }),
  province("eastern-anatolia-erzurum", "Theodosiopolis", "erzurum", "ilkhanate", [41.28, 39.90], { terrain: "highland", strategic: true, borderConfidence: "medium" }),
  province("cilicia-sis", "Sis", "sis", "cilicia", [35.80, 37.45], { terrain: "mountain", strategic: true, borderConfidence: "medium" }),
  province("cilicia-tarsos", "Tarsos", "tarsus", "cilicia", [34.90, 36.92], { coastal: true, terrain: "coast", strategic: true, borderConfidence: "medium" }),
  province("cilicia-alaiye", "Alaiye", null, "karaman", [31.99, 36.55], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "low" }),
  province("lycaonia-konya", "Iconium", "konya", "karaman", [32.49, 37.87], { terrain: "plateau", strategic: true, borderConfidence: "medium" }),
  province("lycaonia-larende", "Larende", "larende", "karaman", [33.22, 37.18], { terrain: "mountain", strategic: true, borderConfidence: "medium" }),
]);

export const ANATOLIA_PROVINCE_BY_ID = Object.freeze(
  Object.fromEntries(ANATOLIA_PROVINCE_METADATA.map((item) => [item.id, item])),
);

export function getProvinceMetadata(id) {
  return ANATOLIA_PROVINCE_BY_ID[id] ?? null;
}
