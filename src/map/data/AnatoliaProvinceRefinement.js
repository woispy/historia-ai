/**
 * Historia AI — Phase 2C Anatolia cartographic refinement.
 *
 * Source-derived GIS remains the geometry authority. These anchors, terrain
 * classes and strategic features constrain presentation and future simulation
 * without inventing false cadastral precision for medieval borders.
 */

export const ANATOLIA_TERRAIN_PROFILES = Object.freeze({
  "coastal-lowland": { movementCost: 1, defenseBonus: 0, winterSeverity: 1, agriculture: "good" },
  "coastal-mountain": { movementCost: 2, defenseBonus: 2, winterSeverity: 2, agriculture: "moderate" },
  "coastal-plain": { movementCost: 1, defenseBonus: 0, winterSeverity: 1, agriculture: "good" },
  "coastal-hills": { movementCost: 2, defenseBonus: 1, winterSeverity: 2, agriculture: "moderate" },
  lowland: { movementCost: 1, defenseBonus: 0, winterSeverity: 1, agriculture: "good" },
  "lowland-hills": { movementCost: 2, defenseBonus: 1, winterSeverity: 1, agriculture: "moderate" },
  valley: { movementCost: 1, defenseBonus: 1, winterSeverity: 1, agriculture: "good" },
  "river-valley": { movementCost: 1, defenseBonus: 1, winterSeverity: 1, agriculture: "good" },
  plateau: { movementCost: 2, defenseBonus: 1, winterSeverity: 2, agriculture: "moderate" },
  "plateau-river": { movementCost: 2, defenseBonus: 1, winterSeverity: 2, agriculture: "moderate" },
  highland: { movementCost: 3, defenseBonus: 2, winterSeverity: 3, agriculture: "poor" },
  "highland-frontier": { movementCost: 3, defenseBonus: 2, winterSeverity: 3, agriculture: "poor" },
  "highland-lake": { movementCost: 3, defenseBonus: 2, winterSeverity: 3, agriculture: "moderate" },
  "highland-valley": { movementCost: 3, defenseBonus: 2, winterSeverity: 3, agriculture: "moderate" },
  "highland-volcanic": { movementCost: 3, defenseBonus: 2, winterSeverity: 3, agriculture: "moderate" },
  "lake-basin": { movementCost: 2, defenseBonus: 1, winterSeverity: 2, agriculture: "good" },
  "lake-mountain": { movementCost: 3, defenseBonus: 2, winterSeverity: 3, agriculture: "moderate" },
  "mountain-foot": { movementCost: 3, defenseBonus: 2, winterSeverity: 3, agriculture: "moderate" },
  mountain: { movementCost: 4, defenseBonus: 3, winterSeverity: 4, agriculture: "poor" },
  "mountain-pass": { movementCost: 4, defenseBonus: 3, winterSeverity: 4, agriculture: "poor" },
  "hills-coast": { movementCost: 2, defenseBonus: 1, winterSeverity: 2, agriculture: "moderate" },
});

const anchor = (x, y, terrainClass, settlementDensity) => ({
  anchor: [x, y],
  terrainClass,
  settlementDensity,
  geometryMode: "source-derived-with-anchor-refinement",
  borderConfidence: "medium",
  coastConstrained: terrainClass.startsWith("coastal"),
});

export const ANATOLIA_PROVINCE_REFINEMENTS = Object.freeze({
  "bithynia-nicomedia": anchor(29.92, 40.77, "coastal-lowland", "high"),
  "bithynia-nicaea": anchor(29.72, 40.43, "lake-basin", "high"),
  "bithynia-prusa": anchor(29.06, 40.19, "mountain-foot", "high"),
  "bithynia-sangarios": anchor(30.52, 40.00, "river-valley", "medium"),
  "phrygia-sogut": anchor(30.17, 40.02, "highland-frontier", "low"),
  "phrygia-bilecik": anchor(30.15, 40.15, "highland-frontier", "low"),
  "phrygia-eskisehir": anchor(30.53, 39.78, "plateau-river", "low"),
  "mysia-balikesir": anchor(27.88, 39.65, "lowland", "medium"),
  "mysia-pergamon": anchor(27.18, 39.12, "lowland-hills", "medium"),
  "lydia-magnesia": anchor(27.43, 38.62, "valley", "high"),
  "lydia-smyrna": anchor(27.14, 38.42, "coastal-lowland", "high"),
  "ionia-ayasuluk": anchor(27.37, 37.95, "coastal-lowland", "medium"),
  "lydia-birgi": anchor(28.06, 38.25, "valley", "medium"),
  "caria-tralleis": anchor(27.84, 37.86, "river-valley", "medium"),
  "caria-mylasa": anchor(27.78, 37.32, "hills-coast", "high"),
  "caria-pecin": anchor(27.57, 37.27, "hills-coast", "medium"),
  "caria-halikarnassos": anchor(27.43, 37.03, "coastal-hills", "high"),
  "phrygia-denizli": anchor(29.09, 37.78, "valley", "medium"),
  "phrygia-uluborlu": anchor(30.45, 38.08, "highland-lake", "low"),
  "pisidia-egirdir": anchor(30.85, 37.87, "lake-mountain", "low"),
  "phrygia-afyon": anchor(30.56, 38.75, "highland", "low"),
  "pisidia-beysehir": anchor(31.72, 37.68, "lake-mountain", "low"),
  "phrygia-kutahya": anchor(29.98, 39.42, "highland", "low"),
  "galatia-ankara": anchor(32.85, 39.92, "plateau", "high"),
  "cappadocia-kayseri": anchor(35.49, 38.72, "highland-volcanic", "medium"),
  "cappadocia-sivas": anchor(37.02, 39.75, "plateau", "medium"),
  "lycaonia-konya": anchor(32.49, 37.87, "plateau", "high"),
  "lycaonia-larende": anchor(33.22, 37.18, "mountain-foot", "medium"),
  "pontus-sinop": anchor(35.16, 42.02, "coastal-mountain", "high"),
  "pontus-amisos": anchor(36.33, 41.29, "coastal-lowland", "high"),
  "pontus-amasya": anchor(35.83, 40.65, "river-valley", "medium"),
  "pontus-kastamon": anchor(33.78, 41.38, "mountain", "medium"),
  "pontus-trebizond": anchor(39.72, 41.00, "coastal-mountain", "high"),
  "eastern-anatolia-erzincan": anchor(39.49, 39.75, "highland-valley", "medium"),
  "eastern-anatolia-erzurum": anchor(41.28, 39.90, "highland", "low"),
  "cilicia-sis": anchor(35.80, 37.45, "mountain-pass", "low"),
  "cilicia-tarsos": anchor(34.90, 36.92, "coastal-plain", "high"),
  "cilicia-alaiye": anchor(31.99, 36.55, "coastal-mountain", "low"),
});

export const ANATOLIA_ADJACENCY_HINTS = Object.freeze({
  "bithynia-nicomedia": ["bithynia-nicaea", "bithynia-prusa", "bithynia-sangarios"],
  "bithynia-nicaea": ["bithynia-nicomedia", "bithynia-prusa", "bithynia-sangarios"],
  "bithynia-prusa": ["bithynia-nicomedia", "bithynia-nicaea", "phrygia-sogut", "phrygia-bilecik", "bithynia-sangarios"],
  "bithynia-sangarios": ["bithynia-nicomedia", "bithynia-nicaea", "bithynia-prusa", "phrygia-sogut", "phrygia-bilecik", "phrygia-eskisehir"],
  "phrygia-sogut": ["bithynia-sangarios", "bithynia-prusa", "phrygia-bilecik", "phrygia-kutahya"],
  "phrygia-bilecik": ["bithynia-prusa", "phrygia-sogut", "phrygia-eskisehir", "phrygia-kutahya"],
  "phrygia-eskisehir": ["bithynia-sangarios", "phrygia-bilecik", "phrygia-kutahya", "galatia-ankara"],
  "mysia-balikesir": ["mysia-pergamon", "phrygia-kutahya", "lydia-magnesia"],
  "mysia-pergamon": ["mysia-balikesir", "lydia-magnesia"],
  "lydia-magnesia": ["mysia-balikesir", "mysia-pergamon", "lydia-smyrna", "lydia-birgi", "phrygia-kutahya"],
  "lydia-smyrna": ["lydia-magnesia", "ionia-ayasuluk"],
  "ionia-ayasuluk": ["lydia-smyrna", "lydia-birgi", "caria-tralleis"],
  "lydia-birgi": ["lydia-magnesia", "ionia-ayasuluk", "caria-tralleis", "phrygia-denizli"],
  "caria-tralleis": ["ionia-ayasuluk", "lydia-birgi", "caria-mylasa", "phrygia-denizli"],
  "caria-mylasa": ["caria-tralleis", "caria-pecin", "caria-halikarnassos"],
  "caria-pecin": ["caria-mylasa", "caria-halikarnassos"],
  "caria-halikarnassos": ["caria-mylasa", "caria-pecin"],
  "phrygia-denizli": ["lydia-birgi", "caria-tralleis", "phrygia-afyon", "phrygia-uluborlu"],
  "phrygia-uluborlu": ["phrygia-denizli", "pisidia-egirdir", "phrygia-afyon", "pisidia-beysehir"],
  "pisidia-egirdir": ["phrygia-uluborlu", "phrygia-afyon", "pisidia-beysehir", "lycaonia-konya"],
  "phrygia-afyon": ["phrygia-denizli", "phrygia-uluborlu", "pisidia-egirdir", "phrygia-kutahya", "pisidia-beysehir"],
  "pisidia-beysehir": ["phrygia-uluborlu", "pisidia-egirdir", "phrygia-afyon", "lycaonia-konya", "lycaonia-larende"],
  "phrygia-kutahya": ["phrygia-sogut", "phrygia-bilecik", "phrygia-eskisehir", "mysia-balikesir", "lydia-magnesia", "phrygia-afyon", "galatia-ankara"],
  "galatia-ankara": ["phrygia-eskisehir", "phrygia-kutahya", "cappadocia-sivas", "lycaonia-konya", "pontus-kastamon"],
  "cappadocia-kayseri": ["cappadocia-sivas", "lycaonia-konya", "eastern-anatolia-erzincan"],
  "cappadocia-sivas": ["galatia-ankara", "cappadocia-kayseri", "lycaonia-konya", "pontus-amasya", "pontus-kastamon", "eastern-anatolia-erzincan"],
  "lycaonia-konya": ["galatia-ankara", "cappadocia-kayseri", "cappadocia-sivas", "pisidia-egirdir", "pisidia-beysehir", "lycaonia-larende"],
  "lycaonia-larende": ["lycaonia-konya", "pisidia-beysehir", "cilicia-sis", "cilicia-alaiye"],
  "pontus-sinop": ["pontus-amisos", "pontus-kastamon"],
  "pontus-amisos": ["pontus-sinop", "pontus-amasya", "pontus-trebizond"],
  "pontus-amasya": ["pontus-amisos", "pontus-kastamon", "cappadocia-sivas", "eastern-anatolia-erzincan"],
  "pontus-kastamon": ["pontus-sinop", "pontus-amasya", "galatia-ankara", "cappadocia-sivas"],
  "pontus-trebizond": ["pontus-amisos", "eastern-anatolia-erzincan", "eastern-anatolia-erzurum"],
  "eastern-anatolia-erzincan": ["cappadocia-kayseri", "cappadocia-sivas", "pontus-amasya", "pontus-trebizond", "eastern-anatolia-erzurum", "cilicia-sis"],
  "eastern-anatolia-erzurum": ["cappadocia-sivas", "pontus-trebizond", "eastern-anatolia-erzincan"],
  "cilicia-sis": ["lycaonia-larende", "eastern-anatolia-erzincan", "cilicia-tarsos"],
  "cilicia-tarsos": ["cilicia-sis", "cilicia-alaiye"],
  "cilicia-alaiye": ["lycaonia-larende", "cilicia-tarsos"],
});

export const ANATOLIA_STRATEGIC_PASSES = Object.freeze([
  { id: "dorylaion-sangarios-corridor", name: "Dorylaion–Sangarios Corridor", provinces: ["phrygia-eskisehir", "phrygia-sogut"], coordinate: [30.30, 39.93], kind: "frontier-corridor", confidence: "medium" },
  { id: "bithynian-olympus-pass", name: "Bithynian Olympus Pass", provinces: ["bithynia-prusa", "bithynia-nicaea"], coordinate: [29.45, 40.34], kind: "mountain-pass", confidence: "medium" },
  { id: "kutahya-sangarios-route", name: "Kütahya–Sangarios Route", provinces: ["phrygia-kutahya", "phrygia-bilecik"], coordinate: [30.05, 39.85], kind: "highland-pass", confidence: "medium" },
  { id: "afyon-saddle", name: "Afyon Saddle", provinces: ["phrygia-afyon", "pisidia-beysehir"], coordinate: [30.95, 38.30], kind: "highland-pass", confidence: "high" },
  { id: "egirdir-konya-corridor", name: "Eğirdir–Konya Corridor", provinces: ["pisidia-egirdir", "lycaonia-konya"], coordinate: [31.25, 37.78], kind: "lake-highland-pass", confidence: "medium" },
  { id: "cilician-gates", name: "Cilician Gates", provinces: ["cilicia-sis", "lycaonia-larende"], coordinate: [34.69, 37.24], kind: "mountain-pass", confidence: "high" },
  { id: "taurus-western-pass", name: "Western Taurus Pass", provinces: ["lycaonia-larende", "cilicia-alaiye"], coordinate: [32.15, 36.70], kind: "mountain-pass", confidence: "medium" },
  { id: "pontic-interior-pass", name: "Pontic Interior Pass", provinces: ["pontus-kastamon", "galatia-ankara"], coordinate: [33.15, 40.55], kind: "mountain-pass", confidence: "medium" },
  { id: "sivas-erzincan-corridor", name: "Sivas–Erzincan Corridor", provinces: ["cappadocia-sivas", "eastern-anatolia-erzincan"], coordinate: [38.15, 39.75], kind: "highland-corridor", confidence: "medium" },
]);

export const ANATOLIA_RIVER_CROSSINGS = Object.freeze([
  { id: "sakarya-upper-crossing", name: "Upper Sakarya Crossing", provinces: ["bithynia-sangarios", "phrygia-eskisehir"], coordinate: [30.78, 40.32], river: "Sakarya", confidence: "high" },
  { id: "sakarya-bilecik-crossing", name: "Bilecik Sakarya Crossing", provinces: ["phrygia-bilecik", "phrygia-eskisehir"], coordinate: [30.36, 39.96], river: "Sakarya", confidence: "medium" },
  { id: "gediz-valley-crossing", name: "Gediz Valley Crossing", provinces: ["lydia-magnesia", "phrygia-kutahya"], coordinate: [28.75, 38.95], river: "Gediz", confidence: "medium" },
  { id: "buyuk-menderes-crossing", name: "Büyük Menderes Crossing", provinces: ["caria-tralleis", "phrygia-denizli"], coordinate: [29.35, 37.72], river: "Büyük Menderes", confidence: "medium" },
  { id: "kizilirmak-ankara-corridor", name: "Kızılırmak Ankara Corridor", provinces: ["galatia-ankara", "cappadocia-sivas"], coordinate: [34.10, 39.85], river: "Kızılırmak", confidence: "medium" },
  { id: "yesilirmak-amasya-crossing", name: "Yeşilırmak Amasya Crossing", provinces: ["pontus-amasya", "cappadocia-sivas"], coordinate: [35.65, 40.30], river: "Yeşilırmak", confidence: "medium" },
  { id: "seyhan-tarsos-crossing", name: "Seyhan Tarsos Crossing", provinces: ["cilicia-tarsos", "cilicia-sis"], coordinate: [35.35, 37.25], river: "Seyhan", confidence: "medium" },
]);

export function getAnatoliaProvinceRefinement(id) {
  const item = ANATOLIA_PROVINCE_REFINEMENTS[id];
  if (!item) return null;
  const terrain = ANATOLIA_TERRAIN_PROFILES[item.terrainClass];
  return terrain ? Object.freeze({ ...item, terrain }) : item;
}

export function getAnatoliaProvinceNeighbors(id) {
  return ANATOLIA_ADJACENCY_HINTS[id] ?? [];
}
