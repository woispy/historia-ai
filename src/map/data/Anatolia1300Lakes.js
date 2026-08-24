/**
 * Historia AI — 1300 Anatolia province lake presentation metadata.
 *
 * Presentation/inspection metadata only. Physical lake geometry remains owned
 * by the physical geography atlas. A province is listed only when a named lake
 * is an important geographic fact for the province and its province anchor is
 * verified in the 1300 metadata set.
 */

const lake = (name, detail = null) => Object.freeze({ name, detail });

export const ANATOLIA_1300_PROVINCE_LAKES = Object.freeze({
  "bithynia-nicaea": lake("İznik Gölü", "Nicaea'nın güneyindeki büyük tatlı su gölü ve doğal coğrafi referans"),
  "pisidia-egirdir": lake("Eğirdir Gölü", "Pisidia'nın önemli göl havzası; Eğirdir yerleşimi gölün doğu kıyısındadır"),
  "pisidia-beysehir": lake("Beyşehir Gölü", "Beyşehir havzasının temel coğrafi unsuru ve önemli tatlı su gölü"),
});

export function getAnatolia1300Lake(provinceId) {
  return ANATOLIA_1300_PROVINCE_LAKES[provinceId] ?? null;
}
