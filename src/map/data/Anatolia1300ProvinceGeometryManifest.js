/**
 * 1300 Anatolia geometry authority manifest.
 *
 * The manifest is intentionally aligned with the currently authoritative
 * 1300 province metadata. It contains no invented polygon coordinates. A
 * province is not considered ready for cartographic refinement until it has
 * a stable geometry key and a physical-land clipping requirement.
 *
 * The historical 1300 province set is currently 38 entries. Additional
 * historical candidates (Attaleia, Myra, Pisidian Antioch, Niğde, Malatya,
 * and Adana) must first be promoted into AnatoliaProvinceMetadata with their
 * historical evidence before they are admitted here.
 */

const geometry = (id, sourceKey, notes = null) => Object.freeze({
  id,
  sourceKey,
  clipToPhysicalLand: true,
  notes,
});

export const ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST = Object.freeze([
  geometry("bithynia-nicomedia", "nicomedia"),
  geometry("bithynia-nicaea", "nicaea"),
  geometry("bithynia-prusa", "prusa"),
  geometry("bithynia-sangarios", "sangarios-frontier", "Frontier envelope; not a surveyed administrative border."),
  geometry("phrygia-sogut", "sogut-frontier", "Frontier envelope; preserve uncertainty."),
  geometry("phrygia-bilecik", "bilecik", "Local frontier anchor; exact extent remains approximate."),
  geometry("phrygia-eskisehir", "dorylaion", "Geographic anchor; do not imply uncontested Ottoman control."),
  geometry("mysia-balikesir", "balikesir"),
  geometry("mysia-pergamon", "pergamon"),
  geometry("lydia-magnesia", "magnesia"),
  geometry("lydia-smyrna", "smyrna"),
  geometry("ionia-ayasuluk", "ayasuluk"),
  geometry("lydia-birgi", "birgi"),
  geometry("caria-tralleis", "tralleis"),
  geometry("caria-mylasa", "mylasa"),
  geometry("caria-pecin", "pecin"),
  geometry("caria-halikarnassos", "halikarnassos"),
  geometry("phrygia-denizli", "ladik"),
  geometry("phrygia-uluborlu", "uluborlu"),
  geometry("pisidia-egirdir", "egirdir"),
  geometry("phrygia-afyon", "afyon"),
  geometry("pisidia-beysehir", "beysehir"),
  geometry("phrygia-kutahya", "kutahya"),
  geometry("galatia-ankara", "ankara"),
  geometry("cappadocia-kayseri", "kayseri"),
  geometry("cappadocia-sivas", "sivas"),
  geometry("lycaonia-konya", "konya"),
  geometry("lycaonia-larende", "larende"),
  geometry("pontus-sinop", "sinop"),
  geometry("pontus-amisos", "amisos"),
  geometry("pontus-amasya", "amasya"),
  geometry("pontus-kastamon", "kastamon"),
  geometry("pontus-trabzon", "trabzon"),
  geometry("eastern-anatolia-erzincan", "erzincan"),
  geometry("eastern-anatolia-erzurum", "erzurum"),
  geometry("cilicia-sis", "sis"),
  geometry("cilicia-tarsus", "tarsus"),
  geometry("cilicia-alaiye", "alaiye"),
]);

export const ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS = Object.freeze(
  Object.fromEntries(
    ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.map(({ id, sourceKey }) => [id, sourceKey]),
  ),
);

export function getAnatolia1300ProvinceGeometryManifest(provinceId) {
  return ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.find((entry) => entry.id === provinceId) ?? null;
}
