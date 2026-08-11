/**
 * Historia AI — 1300 Anatolia historical reconstruction profile.
 *
 * This layer separates historical political context from geometry. A polity can
 * be historically relevant without being a safe assertion of exact cadastral
 * control on 1 January 1300. That distinction is required for an honest grand-
 * strategy reconstruction of the frontier world.
 */

export const HISTORICAL_CONFIDENCE = Object.freeze([
  "high",
  "medium",
  "low",
]);

export const ANATOLIA_1300_POLITIES = Object.freeze({
  byzantium: {
    id: "byzantium",
    name: "Byzantine Empire",
    startYear: -330,
    controlAt1300: "established",
    confidence: "high",
    note: "Bithynian coastal and urban centres remain Byzantine in the 1300 starting frame; the eastern frontier is contested.",
  },
  ottomans: {
    id: "ottomans",
    name: "Ottoman Emirate",
    startYear: 1299,
    controlAt1300: "frontier-emirate",
    confidence: "medium",
    note: "Use as a frontier polity rather than a modern state border. The exact extent of Osman’s 1300 domain is deliberately uncertain.",
  },
  germiyan: {
    id: "germiyan",
    name: "Germiyanid Emirate",
    startYear: 1300,
    controlAt1300: "emerging-independent",
    confidence: "medium",
    note: "Yakub Bey’s independent phase begins around 1300; Kütahya is the secure geographic anchor.",
  },
  karasi: {
    id: "karasi",
    name: "Karasid Emirate",
    startYear: 1296,
    controlAt1300: "established-frontier",
    confidence: "medium",
    note: "Karasi expansion in Mysia is attested from the late 1290s; exact inland limits remain approximate.",
  },
  saruhan: {
    id: "saruhan",
    name: "Saruhanid Emirate",
    startYear: 1290,
    controlAt1300: "emerging-emirate",
    confidence: "medium",
    note: "Saruhan Bey is active around Manisa from the 1290s; later territorial descriptions must not be projected backward as exact 1300 borders.",
  },
  mentese: {
    id: "mentese",
    name: "Menteshid Emirate",
    startYear: 1280,
    controlAt1300: "established-emirate",
    confidence: "high",
    note: "Menteshe control in southwestern Anatolia predates 1300; the early chronology and exact frontier remain partly uncertain.",
  },
  aydin: {
    id: "aydin",
    name: "Aydinid Emirate",
    startYear: 1308,
    controlAt1300: "not-yet-established",
    confidence: "high",
    note: "Do not paint Aydinid ownership onto the 1300 start state. Mehmed Bey’s takeover of Aydin-ili is dated to 1308.",
  },
  hamid: {
    id: "hamid",
    name: "Hamidid Emirate",
    startYear: 1300,
    controlAt1300: "emerging-frontier",
    confidence: "medium",
    note: "The Hamidid presence is late-13th/early-14th-century. Dündar Bey is securely attested from 1301, so 1300 ownership should remain cautious.",
  },
  esref: {
    id: "esref",
    name: "Eshrefid Emirate",
    startYear: 1280,
    controlAt1300: "established-emirate",
    confidence: "high",
    note: "Beyşehir and Seydişehir are secure anchors for the late-13th/early-14th-century Eshrefid domain.",
  },
  sahibata: {
    id: "sahibata",
    name: "Sahib Ata legacy sphere",
    startYear: 1250,
    controlAt1300: "contested-legacy",
    confidence: "low",
    note: "Retained only as a historical context label; it must not be treated as a clean sovereign state polygon in 1300.",
  },
  karaman: {
    id: "karaman",
    name: "Karamanid Emirate",
    startYear: 1256,
    controlAt1300: "established-emirate",
    confidence: "high",
    note: "Karamanid power is well established in central and southern Anatolia by 1300, although individual frontier limits remain approximate.",
  },
  candar: {
    id: "candar",
    name: "Candaroğulları",
    startYear: 1292,
    controlAt1300: "emerging-emirate",
    confidence: "medium",
    note: "Candarid formation belongs to the turn of the fourteenth century; Sinop/Kastamonu require separate treatment because Pervâneoğulları still matter at Sinop in 1300.",
  },
  pervane: {
    id: "pervane",
    name: "Pervâneoğulları",
    startYear: 1277,
    endYear: 1322,
    controlAt1300: "established-local-emirate",
    confidence: "high",
    note: "Sinop remains Pervâneoğulları territory in 1300; this prevents anachronistically assigning Sinop to the later Candarid state.",
  },
  trebizond: {
    id: "trebizond",
    name: "Empire of Trebizond",
    startYear: 1204,
    controlAt1300: "established-empire",
    confidence: "high",
    note: "The eastern Black Sea coastal state is treated separately from the Anatolian Turkmen polities.",
  },
  ilkhanate: {
    id: "ilkhanate",
    name: "Ilkhanate suzerainty",
    startYear: 1256,
    endYear: 1353,
    controlAt1300: "overlordship",
    confidence: "high",
    note: "Ilkhanid authority is modelled as an overlordship relationship, not as a blanket painted occupation of every Anatolian province.",
  },
  cilicia: {
    id: "cilicia",
    name: "Armenian Kingdom of Cilicia",
    startYear: 1198,
    endYear: 1375,
    controlAt1300: "established-kingdom",
    confidence: "high",
    note: "Cilician Armenian territory is kept distinct from the later Karamanid expansion around Alaiye and the Taurus passes.",
  },
});

export const ANATOLIA_1300_REGIONS = Object.freeze([
  {
    id: "bithynia",
    name: "Bithynia",
    focus: "Byzantine urban core and Ottoman frontier",
    confidence: "high",
    provinceIds: ["bithynia-nicomedia", "bithynia-nicaea", "bithynia-prusa"],
  },
  {
    id: "ottoman-frontier",
    name: "Sangarios Frontier",
    focus: "Ottoman frontier geography",
    confidence: "medium",
    provinceIds: ["bithynia-sangarios", "phrygia-sogut", "phrygia-bilecik", "phrygia-eskisehir"],
  },
  {
    id: "mysia",
    name: "Mysia",
    focus: "Karasid northwest Anatolia",
    confidence: "medium",
    provinceIds: ["mysia-balikesir", "mysia-pergamon"],
  },
  {
    id: "aegean-west",
    name: "Lydia and Ionia",
    focus: "Saruhanid and emerging Aydinid frontier",
    confidence: "medium",
    provinceIds: ["lydia-magnesia", "lydia-smyrna", "ionia-ayasuluk", "lydia-birgi", "caria-tralleis"],
  },
  {
    id: "mentese-caria",
    name: "Caria / Menteşe",
    focus: "Established southwestern emirate",
    confidence: "high",
    provinceIds: ["caria-mylasa", "caria-pecin", "caria-halikarnassos"],
  },
  {
    id: "inner-west",
    name: "Inner Western Anatolia",
    focus: "Germiyan, Hamid and uncertain frontier zones",
    confidence: "medium",
    provinceIds: ["phrygia-denizli", "phrygia-uluborlu", "pisidia-egirdir", "phrygia-afyon", "pisidia-beysehir", "phrygia-kutahya"],
  },
  {
    id: "central-anatolia",
    name: "Central Anatolia",
    focus: "Karamanid and Ilkhanid-overlordship context",
    confidence: "medium",
    provinceIds: ["galatia-ankara", "cappadocia-kayseri", "cappadocia-sivas", "lycaonia-konya", "lycaonia-larende"],
  },
  {
    id: "pontus",
    name: "Pontus",
    focus: "Pervâneoğulları, Candarid emergence and Trebizond",
    confidence: "medium",
    provinceIds: ["pontus-sinop", "pontus-amisos", "pontus-amasya", "pontus-kastamon", "pontus-trebizond"],
  },
  {
    id: "eastern-anatolia",
    name: "Eastern Anatolia",
    focus: "Ilkhanid suzerainty and frontier geography",
    confidence: "medium",
    provinceIds: ["eastern-anatolia-erzincan", "eastern-anatolia-erzurum"],
  },
  {
    id: "cilicia",
    name: "Cilicia and Taurus",
    focus: "Cilician Armenian core and southern frontier",
    confidence: "medium",
    provinceIds: ["cilicia-sis", "cilicia-tarsos", "cilicia-alaiye"],
  },
]);

export function getAnatolia1300Polity(id) {
  return ANATOLIA_1300_POLITIES[id] ?? null;
}

export function getAnatolia1300Region(id) {
  return ANATOLIA_1300_REGIONS.find((region) => region.id === id) ?? null;
}

export function isPolityActiveAt1300(polity) {
  return Boolean(polity && polity.startYear <= 1300 && (polity.endYear == null || polity.endYear >= 1300));
}
