/**
 * Historia AI — 1300 Anatolia province lake presentation metadata.
 *
 * Presentation/inspection metadata only. Physical lake geometry remains owned
 * by the physical geography atlas. A province is listed only when a named lake
 * is an important geographic fact for the province.
 */

const lake = (name, detail = null) => Object.freeze({ name, detail });

export const ANATOLIA_1300_PROVINCE_LAKES = Object.freeze({
  "bithynia-nicaea": lake("İznik Gölü", "Nicaea'nın güneyindeki büyük tatlı su gölü ve doğal coğrafi referans"),
  "pisidia-egirdir": lake("Eğirdir Gölü", "Pisidia'nın önemli göl havzası; Eğirdir yerleşimi gölün doğu kıyısındadır"),
  "pisidia-beysehir": lake("Beyşehir Gölü", "Anadolu'nun büyük tatlı su göllerinden biri ve Beyşehir havzasının temel coğrafi unsuru"),
  "cappadocia-kayseri": lake("Tuz Gölü", "Orta Anadolu'nun büyük kapalı havza sisteminin önemli göl alanı"),
  "eastern-anatolia-van": lake("Van Gölü", "Doğu Anadolu'nun büyük kapalı havza gölü ve önemli bölgesel coğrafi sınır"),
});

export function getAnatolia1300Lake(provinceId) {
  return ANATOLIA_1300_PROVINCE_LAKES[provinceId] ?? null;
}
