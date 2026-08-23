/**
 * 1300 Anatolia cartographic centroid corrections and area-balancing weights.
 *
 * These are presentation-geography anchors, not claims of cadastral borders.
 * Centroids follow historical centres and real geography; weights only tune the
 * tessellation so dense coastal centres do not collapse into visual micro-cells.
 */

const CARTOGRAPHIC_CENTROIDS = Object.freeze({
  "bithynia-nicomedia": [29.98, 40.72],
  "bithynia-nicaea": [29.73, 40.48],
  "bithynia-prusa": [29.08, 40.20],
  "bithynia-sangarios": [30.62, 40.03],
  "phrygia-sogut": [30.00, 40.06],
  "phrygia-bilecik": [30.20, 40.24],
  "phrygia-eskisehir": [30.66, 39.78],
  "mysia-balikesir": [27.91, 39.64],
  "mysia-pergamon": [27.22, 39.18],
  "lydia-magnesia": [27.54, 38.62],
  "lydia-smyrna": [27.17, 38.46],
  "ionia-ayasuluk": [27.37, 37.95],
  "lydia-birgi": [28.20, 38.20],
  "caria-tralleis": [28.00, 37.90],
  "caria-mylasa": [27.78, 37.33],
  "caria-pecin": [27.58, 37.26],
  "caria-halikarnassos": [27.43, 37.04],
  "phrygia-denizli": [29.16, 37.76],
  "phrygia-uluborlu": [30.38, 38.10],
  "pisidia-egirdir": [30.86, 37.96],
  "phrygia-afyon": [30.63, 38.76],
  "pisidia-beysehir": [31.72, 37.62],
  "phrygia-kutahya": [29.92, 39.40],
  "galatia-ankara": [32.92, 39.92],
  "cappadocia-kayseri": [35.55, 38.73],
  "cappadocia-sivas": [37.20, 39.72],
  "lycaonia-konya": [32.48, 37.92],
  "lycaonia-larende": [33.28, 37.18],
  "pontus-sinop": [35.18, 41.98],
  "pontus-amisos": [36.38, 41.30],
  "pontus-amasya": [35.82, 40.66],
  "pontus-kastamon": [33.70, 41.40],
});

// Power-diagram weights are deliberately small. Higher weight gives the seed
// a little more cartographic influence without moving its historical centre.
const CARTOGRAPHIC_WEIGHTS = Object.freeze({
  "lydia-smyrna": 0.055,
  "ionia-ayasuluk": 0.060,
  "lydia-birgi": 0.045,
  "caria-tralleis": 0.055,
  "caria-mylasa": 0.050,
  "caria-pecin": 0.045,
  "caria-halikarnassos": 0.060,
  "mysia-pergamon": 0.030,
  "phrygia-denizli": 0.030,
  "pisidia-egirdir": 0.025,
  "pisidia-beysehir": 0.030,
});

function isTekeOrAntalya(id) {
  const value = String(id ?? "").toLowerCase();
  return value.includes("teke") || value.includes("antalya") || value.includes("attaleia");
}

function isLikelyCappadocianEast(id) {
  const value = String(id ?? "").toLowerCase();
  return value.includes("malatya") || value.includes("erzincan") || value.includes("divrigi");
}

export function applyAnatoliaProvinceCartographicOverrides(metadata) {
  for (const province of metadata ?? []) {
    const explicit = CARTOGRAPHIC_CENTROIDS[province.id];
    if (explicit) province.centroid = [...explicit];

    if (!explicit && isTekeOrAntalya(province.id)) {
      province.centroid = [30.72, 36.88];
    }

    if (!explicit && isLikelyCappadocianEast(province.id)) {
      province.centroid = [38.15, 38.35];
    }

    province.cartographicWeight = CARTOGRAPHIC_WEIGHTS[province.id] ?? 0;
  }

  return metadata;
}
