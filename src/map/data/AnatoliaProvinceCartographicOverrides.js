/**
 * 1300 Anatolia cartographic centroid corrections and area-balancing weights.
 *
 * These are presentation-geography anchors, not claims of cadastral borders.
 * Centroids follow historical centres and real geography; weights only tune the
 * tessellation so dense coastal centres do not collapse into visual micro-cells.
 */

const CARTOGRAPHIC_CENTROIDS = Object.freeze({
  "bithynia-nicomedia": [29.9169, 40.7654],
  "bithynia-nicaea": [29.73, 40.48],
  "bithynia-prusa": [29.08, 40.2],
  "bithynia-sangarios": [30.62, 40.03],
  "phrygia-sogut": [30, 40.06],
  "phrygia-bilecik": [30.2, 40.24],
  "phrygia-eskisehir": [30.66, 39.78],
  "mysia-balikesir": [27.91, 39.64],
  "mysia-pergamon": [27.22, 39.18],
  "lydia-magnesia": [27.54, 38.62],
  "lydia-smyrna": [27.17, 38.46],
  "ionia-ayasuluk": [27.37, 37.95],
  "lydia-birgi": [28.2, 38.2],
  "caria-tralleis": [28, 37.9],
  "caria-mylasa": [27.78, 37.33],
  "caria-pecin": [27.58, 37.26],
  "caria-halikarnassos": [27.43, 37.04],
  "phrygia-denizli": [29.16, 37.76],
  "phrygia-uluborlu": [30.38, 38.1],
  "pisidia-egirdir": [30.97, 38.03],
  "phrygia-afyon": [30.63, 38.76],
  "pisidia-beysehir": [31.72, 37.62],
  "phrygia-kutahya": [29.92, 39.4],
  "galatia-ankara": [32.92, 39.92],
  "cappadocia-kayseri": [35.55, 38.73],
  "cappadocia-sivas": [37.2, 39.72],
  "lycaonia-konya": [32.48, 37.92],
  "lycaonia-larende": [33.28, 37.18],
  "pontus-sinop": [35.18, 41.98],
  "pontus-amisos": [36.38, 41.3],
  "pontus-amasya": [35.82, 40.66],
  "pontus-kastamon": [33.7, 41.4],
  "pontus-trebizond": [39.72, 41],
  "eastern-anatolia-erzincan": [39.72, 39.75],
  "eastern-anatolia-erzurum": [41.28, 39.9],
  "euphrates-malatya": [38.35, 38.35],
  "cilicia-sis": [35.8, 37.45],
  "cilicia-tarsos": [34.9, 36.92],
  "cilicia-alaiye": [31.99, 36.55],
  "pamphylia-attaleia": [30.72, 36.88],
  "lycia-myra": [29.13, 36.26],
  "pisidia-antiochia": [31.19, 38.3],
  "cappadocia-nigde": [34.68, 37.97],
  "cilicia-adana": [35.33, 37],
});

const CARTOGRAPHIC_WEIGHTS = Object.freeze({
  "lydia-smyrna": 0.055,
  "ionia-ayasuluk": 0.06,
  "lydia-birgi": 0.045,
  "caria-tralleis": 0.055,
  "caria-mylasa": 0.05,
  "caria-pecin": 0.045,
  "caria-halikarnassos": 0.06,
  "mysia-pergamon": 0.03,
  "phrygia-denizli": 0.03,
  "pisidia-egirdir": 0.025,
  "pisidia-beysehir": 0.03,
});

function isTekeOrAntalya(id) {
  const value = String(id ?? "").toLowerCase();
  return value.includes("teke") || value.includes("antalya") || value.includes("attaleia");
}

export function applyAnatoliaProvinceCartographicOverrides(metadata) {
  for (const province of metadata ?? []) {
    const explicit = CARTOGRAPHIC_CENTROIDS[province.id];
    if (explicit) province.centroid = [...explicit];

    if (!explicit && isTekeOrAntalya(province.id)) {
      province.centroid = [30.72, 36.88];
    }

    province.cartographicWeight = CARTOGRAPHIC_WEIGHTS[province.id] ?? 0;
  }

  return metadata;
}
