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

const anchor = (x, y, terrainClass, settlementDensity, geometryAnchor = null) => ({
  anchor: [x, y],
  geometryAnchor: geometryAnchor ?? [x, y],
  terrainClass,
  settlementDensity,
  geometryMode: "source-derived-with-anchor-refinement",
  borderConfidence: "medium",
  coastConstrained: terrainClass.startsWith("coastal"),
});

export const ANATOLIA_PROVINCE_REFINEMENTS = Object.freeze({
  "bithynia-nicomedia": anchor(29.92, 40.77, "coastal-lowland", "high", [29.92, 40.705]),
  "bithynia-nicaea": anchor(29.72, 40.43, "lake-basin", "high", [29.69, 40.44]),
  // The historical Bursa settlement remains at the city anchor. The lightweight
  // mainland mask is coarse around Mount Olympus, so Phase 2D gets a separate
  // terrestrial control point immediately inland from the city-side foothills.
  "bithynia-prusa": anchor(29.06, 40.19, "mountain-foot", "high", [29.06, 40.16]),
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