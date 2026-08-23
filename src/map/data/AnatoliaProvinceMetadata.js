/**
 * Historia AI — 1300 Anatolia province presentation metadata.
 *
 * Province geometry is persistent simulation geography. Political ownership is
 * separate and can change over time. Historical control below is a cautious
 * 1300 starting-frame interpretation, not a claim of modern-style cadastral
 * borders.
 */

const province = (id, name, cityId, regionId, countryId, centroid, options = {}) => ({
  id,
  name,
  cityId,
  regionId,
  countryId,
  centroid,
  coastal: false,
  terrain: "plains",
  borderConfidence: "medium",
  strategic: false,
  port: false,
  historicalControl: {
    statusAt1300: "contested",
    confidence: "medium",
    controllerAt1300: countryId,
    startYear: null,
    note: null,
  },
  ...options,
});

export const ANATOLIA_PROVINCE_METADATA = Object.freeze([
  province("bithynia-nicomedia", "Nicomedia", "nikomedia", "bithynia", "byzantium", [29.92, 40.77], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "high", historicalControl: { statusAt1300: "established", confidence: "high", controllerAt1300: "byzantium", startYear: null, note: "Major Byzantine Bithynian centre and fortified port." } }),
  province("bithynia-nicaea", "Nicaea", "iznik", "bithynia", "byzantium", [29.72, 40.43], { terrain: "lake", strategic: true, borderConfidence: "high", historicalControl: { statusAt1300: "established", confidence: "high", controllerAt1300: "byzantium", startYear: null, note: "Major fortified Byzantine city; the Ottoman frontier remains east and south of the city." } }),
  province("bithynia-prusa", "Prusa", "bursa", "bithynia", "byzantium", [29.06, 40.19], { terrain: "mountain", strategic: true, borderConfidence: "high", historicalControl: { statusAt1300: "established", confidence: "high", controllerAt1300: "byzantium", startYear: null, note: "Important Byzantine Bithynian city at the foot of Mount Olympus." } }),

  province("bithynia-sangarios", "Sangarios Frontier", "eskisehir", "ottoman-frontier", "ottomans", [30.52, 40.00], { terrain: "river-valley", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "frontier", confidence: "medium", controllerAt1300: "ottomans", startYear: 1299, note: "Frontier zone; do not interpret this as a surveyed Ottoman administrative province." } }),
  province("phrygia-sogut", "Söğüt Frontier", "sogut", "ottoman-frontier", "ottomans", [30.17, 40.02], { terrain: "highland", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "frontier-emirate", confidence: "medium", controllerAt1300: "ottomans", startYear: 1299, note: "Core Ottoman frontier anchor; exact 1300 extent is intentionally uncertain." } }),
  province("phrygia-bilecik", "Bilecik", "bilecik", "ottoman-frontier", "ottomans", [30.15, 40.15], { terrain: "highland", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "frontier", confidence: "low", controllerAt1300: "ottomans", startYear: 1299, note: "Strategic frontier locality; control should remain probabilistic in later simulation." } }),
  province("phrygia-eskisehir", "Dorylaion", "eskisehir", "ottoman-frontier", "ottomans", [30.53, 39.78], { terrain: "river-valley", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "contested-frontier", confidence: "low", controllerAt1300: null, startYear: null, note: "Kept as a geographic anchor rather than an asserted Ottoman province." } }),

  province("mysia-balikesir", "Balıkesir", "balikesir", "mysia", "karasi", [27.88, 39.65], { coastal: true, terrain: "lowland", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "established-frontier", confidence: "medium", controllerAt1300: "karasi", startYear: 1296, note: "Karasid core around Balıkesir; inland limits remain approximate." } }),
  province("mysia-pergamon", "Pergamon", "bergama", "mysia", "karasi", [27.18, 39.12], { coastal: true, terrain: "lowland", borderConfidence: "medium", historicalControl: { statusAt1300: "frontier-conquest", confidence: "medium", controllerAt1300: "karasi", startYear: 1296, note: "Karasid expansion into Mysia is historically attested, but exact local control is not treated as cadastral." } }),

  province("lydia-magnesia", "Magnesia", "manisa", "aegean-west", "saruhan", [27.43, 38.62], { terrain: "lowland", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "emerging-emirate", confidence: "medium", controllerAt1300: "saruhan", startYear: 1290, note: "Saruhanid activity is attested around Manisa from the 1290s." } }),
  province("lydia-smyrna", "Smyrna", "smyrna", "aegean-west", "saruhan", [27.14, 38.42], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "contested-coast", confidence: "low", controllerAt1300: null, startYear: null, note: "Keep the port as a strategic location without forcing later Saruhanid coastal extent backward to 1300." } }),
  province("ionia-ayasuluk", "Ayasuluk", "ayasuluk", "aegean-west", null, [27.37, 37.95], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "pre-Aydinid", confidence: "high", controllerAt1300: null, startYear: 1308, note: "Aydinid ownership begins later; Mehmed Bey takes control of Aydın-ili in 1308." } }),
  province("lydia-birgi", "Birgi", "birgi", "aegean-west", null, [28.06, 38.25], { terrain: "valley", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "pre-Aydinid", confidence: "high", controllerAt1300: null, startYear: 1308, note: "Aydinid ownership is not painted onto the 1300 start date." } }),
  province("caria-tralleis", "Tralleis", "aydin", "aegean-west", "mentese", [27.84, 37.86], { terrain: "lowland", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "Menteshe-influence", confidence: "medium", controllerAt1300: "mentese", startYear: 1282, note: "Menteshe activity at Tralles is attested in the late thirteenth century; exact 1300 control remains cautious." } }),

  province("caria-mylasa", "Mylasa", "milas", "mentese-caria", "mentese", [27.78, 37.32], { coastal: true, terrain: "coast", strategic: true, borderConfidence: "high", historicalControl: { statusAt1300: "established-emirate", confidence: "high", controllerAt1300: "mentese", startYear: 1280, note: "Core Menteshe geography." } }),
  province("caria-pecin", "Peçin", "pecin", "mentese-caria", "mentese", [27.57, 37.27], { terrain: "coast", strategic: true, borderConfidence: "high", historicalControl: { statusAt1300: "established-emirate", confidence: "high", controllerAt1300: "mentese", startYear: 1280, note: "Early Menteshe political centre." } }),
  province("caria-halikarnassos", "Halikarnassos", "halikarnassos", "mentese-caria", "mentese", [27.43, 37.03], { coastal: true, port: true, terrain: "coast", borderConfidence: "medium", historicalControl: { statusAt1300: "established-emirate", confidence: "medium", controllerAt1300: "mentese", startYear: 1280, note: "Menteshe coastal sphere; precise frontier remains approximate." } }),

  province("phrygia-denizli", "Lâdik", "denizli", "inner-west", null, [29.09, 37.78], { terrain: "valley", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "contested-frontier", confidence: "low", controllerAt1300: null, startYear: null, note: "Do not force later beylik ownership backward onto the 1300 date." } }),
  province("phrygia-uluborlu", "Uluborlu", "uluborlu", "inner-west", null, [30.45, 38.08], { terrain: "highland", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "Hamidid-emerging", confidence: "medium", controllerAt1300: null, startYear: 1301, note: "Hamidid control is treated as emerging around the 1300-1301 transition." } }),
  province("pisidia-egirdir", "Eğirdir", "egirdir", "inner-west", null, [30.85, 37.87], { terrain: "lake", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "Hamidid-emerging", confidence: "medium", controllerAt1300: null, startYear: 1301, note: "Dündar Bey's documented activity at Eğirdir begins in 1301-1302." } }),
  province("phrygia-afyon", "Karahisar-ı Sâhib", "afyon", "inner-west", null, [30.56, 38.75], { terrain: "highland", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "legacy-frontier", confidence: "low", controllerAt1300: null, startYear: null, note: "Sahib Ata legacy is preserved as context, not a clean 1300 sovereign border." } }),
  province("pisidia-beysehir", "Beyşehir", "beysehir", "inner-west", "esref", [31.72, 37.68], { terrain: "lake", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "established-emirate", confidence: "high", controllerAt1300: "esref", startYear: 1280, note: "Secure Eshrefid anchor in the late thirteenth/early fourteenth century." } }),
  province("phrygia-kutahya", "Kütahya", "kutahya", "inner-west", "germiyan", [29.98, 39.42], { terrain: "highland", strategic: true, borderConfidence: "high", historicalControl: { statusAt1300: "emerging-independent", confidence: "high", controllerAt1300: "germiyan", startYear: 1300, note: "Kütahya is the strongest geographic anchor for Yakub Bey's independent phase." } }),

  province("galatia-ankara", "Ancyra", "ankara", "central-anatolia", null, [32.85, 39.92], { terrain: "plateau", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "Ilkhanid-suzerainty", confidence: "medium", controllerAt1300: null, startYear: null, note: "Treat central Anatolian authority as layered suzerainty rather than a simple painted Ilkhanid province." } }),
  province("cappadocia-kayseri", "Caesarea", "kayseri", "central-anatolia", null, [35.49, 38.72], { terrain: "plateau", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "Ilkhanid-suzerainty", confidence: "medium", controllerAt1300: null, startYear: null, note: "Ilkhanid overlordship is distinct from direct local administration." } }),
  province("cappadocia-sivas", "Sebasteia", "sivas", "central-anatolia", null, [37.02, 39.75], { terrain: "plateau", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "Ilkhanid-suzerainty", confidence: "medium", controllerAt1300: null, startYear: null, note: "Regional authority is modelled through layered frontier politics." } }),
  province("lycaonia-konya", "Iconium", "konya", "central-anatolia", "karaman", [32.49, 37.87], { terrain: "plateau", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "established-emirate", confidence: "high", controllerAt1300: "karaman", startYear: 1256, note: "Karamanid political sphere is secure by this period." } }),
  province("lycaonia-larende", "Larende", "larende", "central-anatolia", "karaman", [33.22, 37.18], { terrain: "mountain", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "established-emirate", confidence: "high", controllerAt1300: "karaman", startYear: 1256, note: "Karamanid core around Larende." } }),

  province("pontus-sinop", "Sinope", "sinop", "pontus", "pervane", [35.16, 42.02], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "high", historicalControl: { statusAt1300: "established-local-emirate", confidence: "high", controllerAt1300: "pervane", startYear: 1277, note: "Sinop is Pervâneoğulları in 1300; Candarid ownership would be anachronistic here." } }),
  province("pontus-amisos", "Amisos", "amisos", "pontus", "pervane", [36.33, 41.29], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "Pervaneoğulları-sphere", confidence: "medium", controllerAt1300: "pervane", startYear: 1298, note: "Pervâneoğulları expanded into Bafra and Samsun before 1300." } }),
  province("pontus-amasya", "Amaseia", "amasya", "pontus", null, [35.83, 40.65], { terrain: "river-valley", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "contested-frontier", confidence: "low", controllerAt1300: null, startYear: null, note: "Kept neutral in the presentation layer until a more precise local reconstruction is completed." } }),
  province("pontus-kastamon", "Kastamon", "kastamonu", "pontus", "candar", [33.78, 41.38], { terrain: "mountain", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "Candarid-emerging", confidence: "medium", controllerAt1300: "candar", startYear: 1292, note: "Candarid formation belongs to the turn of the fourteenth century; local control remains approximate." } }),
  province("pontus-trebizond", "Trebizond", "trabzon", "pontus", "trebizond", [39.72, 41.00], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "high", historicalControl: { statusAt1300: "established-empire", confidence: "high", controllerAt1300: "trebizond", startYear: 1204, note: "Independent eastern Black Sea state." } }),

  province("eastern-anatolia-erzincan", "Erzingan", "erzincan", "eastern-anatolia", null, [39.49, 39.75], { terrain: "highland", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "Ilkhanid-suzerainty", confidence: "medium", controllerAt1300: null, startYear: null, note: "Ilkhanid overlordship is represented separately from local provincial ownership." } }),
  province("eastern-anatolia-erzurum", "Theodosiopolis", "erzurum", "eastern-anatolia", null, [41.28, 39.90], { terrain: "highland", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "Ilkhanid-suzerainty", confidence: "medium", controllerAt1300: null, startYear: null, note: "Eastern frontier context; exact local political control requires deeper source reconciliation." } }),

  province("cilicia-sis", "Sis", "sis", "cilicia", "cilicia", [35.80, 37.45], { terrain: "mountain", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "established-kingdom", confidence: "high", controllerAt1300: "cilicia", startYear: 1198, note: "Cilician Armenian core." } }),
  province("cilicia-tarsos", "Tarsos", "tarsus", "cilicia", "cilicia", [34.90, 36.92], { coastal: true, terrain: "coast", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "established-kingdom", confidence: "medium", controllerAt1300: "cilicia", startYear: 1198, note: "Southern Cilician urban anchor." } }),
  province("cilicia-alaiye", "Alaiye", "alaiye", "cilicia", null, [31.99, 36.55], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "contested-southern-frontier", confidence: "low", controllerAt1300: null, startYear: null, note: "Alaiye should not be projected backward from later Karamanid control without a dedicated 1300 source review." } }),

  province("pamphylia-attaleia", "Attaleia", "antalya", "pamphylia", null, [30.71, 36.89], { coastal: true, port: true, terrain: "coast", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "contested-southern-frontier", confidence: "low", controllerAt1300: null, startYear: null, note: "Attaleia is kept neutral at the 1300 start rather than projecting later Teke or Karamanid control backward." } }),
  province("lycia-myra", "Myra", "myra", "lycia", null, [29.13, 36.26], { coastal: true, terrain: "mountain", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "contested-southern-frontier", confidence: "low", controllerAt1300: null, startYear: null, note: "Lycian interior and coast require a cautious frontier treatment at this date." } }),
  province("pisidia-antiochia", "Antioch of Pisidia", "antioch-pisidia", "pisidia", null, [31.19, 38.30], { terrain: "highland", strategic: true, borderConfidence: "low", historicalControl: { statusAt1300: "contested-frontier", confidence: "low", controllerAt1300: null, startYear: null, note: "Geographic anchor for the Pisidian highlands; no later beylik control is projected backward." } }),
  province("cappadocia-nigde", "Niğde", "nigde", "central-anatolia", "karaman", [34.68, 37.97], { terrain: "highland", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "frontier-emirate", confidence: "medium", controllerAt1300: "karaman", startYear: 1300, note: "Niğde belongs to the south-central Karamanid geographic sphere around the 1300 transition." } }),
  province("euphrates-malatya", "Melitene", "malatya", "eastern-anatolia", null, [38.35, 38.35], { terrain: "river-valley", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "Ilkhanid-suzerainty", confidence: "high", controllerAt1300: null, startYear: null, note: "Malatya remained under Ilkhanid administration in the late thirteenth century; the 1315 Mamluk conquest is intentionally kept in the future timeline." } }),
  province("cilicia-adana", "Adana", "adana", "cilicia", "cilicia", [35.33, 37.00], { terrain: "lowland", strategic: true, borderConfidence: "medium", historicalControl: { statusAt1300: "established-kingdom", confidence: "medium", controllerAt1300: "cilicia", startYear: 1198, note: "Cilician Armenian lowland anchor; exact eastern and northern limits remain approximate." } }),
]);

export const ANATOLIA_PROVINCE_BY_ID = Object.freeze(
  Object.fromEntries(ANATOLIA_PROVINCE_METADATA.map((item) => [item.id, item])),
);

export function getProvinceMetadata(id) {
  return ANATOLIA_PROVINCE_BY_ID[id] ?? null;
}

export function getProvinceMetadataForCity(cityId) {
  return ANATOLIA_PROVINCE_METADATA.find((item) => item.cityId === cityId) ?? null;
}