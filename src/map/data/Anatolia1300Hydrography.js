/**
 * Historia AI — 1300 Anatolia province hydrography presentation metadata.
 *
 * Presentation/inspection data only. This does not replace physical river
 * geometry. A province is listed only when a named river system is a useful
 * geographic fact for the province. Basin-only labels are deliberately omitted
 * so the inspector never reports a river merely because a province is near a
 * drainage basin.
 */

const river = (name, detail = null) => Object.freeze({ name, detail });

export const ANATOLIA_1300_PROVINCE_HYDROGRAPHY = Object.freeze({
  "bithynia-prusa": river("Nilüfer Çayı", "Uludağ eteklerinden Bursa ovasına iner"),

  "bithynia-sangarios": river("Sakarya (Sangarios)", "Ana Sakarya koridoru ve tarihsel frontier nehri"),
  "phrygia-bilecik": river("Karasu (Sakarya)", "Bilecik çevresindeki Sakarya'nın önemli kolu ve vadi koridoru"),
  "phrygia-eskisehir": river("Porsuk Çayı", "Dorylaion/Eskişehir ovasının ana akarsuyu"),

  "mysia-pergamon": river("Bakırçay (Kaikos)", "Pergamon ovasının tarihsel ana akarsu sistemi"),

  "lydia-magnesia": river("Gediz (Hermos)", "Magnesia'nın ana vadi koridoru"),
  "lydia-smyrna": river("Meles", "Smyrna çevresindeki tarihsel akarsu"),
  "ionia-ayasuluk": river("Küçük Menderes (Kaystros)", "Ayasuluk/Selçuk çevresindeki ana nehir"),
  "lydia-birgi": river("Küçük Menderes (Kaystros)", "Birgi çevresindeki üst vadi sistemi"),
  "caria-tralleis": river("Büyük Menderes (Maiandros)", "Tralleis'in bağlı olduğu ana vadi sistemi"),

  "phrygia-denizli": river("Büyük Menderes (Maiandros)", "Lâdik/Denizli çevresindeki ana vadi sistemi"),
  "phrygia-uluborlu": river("Aksu Çayı", "Pisidia–Uluborlu havzasının ana akarsu sistemi"),
  "pisidia-egirdir": river("Aksu Çayı", "Eğirdir çevresinden güneye uzanan Aksu sistemi"),
  "phrygia-afyon": river("Akarçay", "Afyon ovasının ana akarsuyu"),
  "pisidia-beysehir": river("Çarşamba Çayı", "Beyşehir Gölü'nün çıkış sistemi"),
  "phrygia-kutahya": river("Porsuk Çayı", "Kütahya ovasından doğuya, Sakarya sistemine akar"),

  "galatia-ankara": river("Ankara Çayı", "Sakarya havzasına bağlanan Ankara vadisi"),
  "cappadocia-kayseri": river("Zamantı Irmağı", "Seyhan sisteminin önemli üst kolu"),
  "cappadocia-sivas": river("Kızılırmak (Halys)", "Sivas çevresinin ana nehir sistemi"),
  "lycaonia-konya": river("Çarşamba Çayı", "Beyşehir-Konya koridorundan Konya ovasına ulaşan akarsu sistemi"),

  "pontus-amisos": river("Kızılırmak (Halys)", "Amisos hinterlandında Karadeniz'e ulaşan büyük nehir"),
  "pontus-amasya": river("Yeşilırmak (Iris)", "Amaseia'nın içinden geçen ana nehir"),
  "pontus-kastamon": river("Gökırmak", "Kastamonu–Taşköprü vadisinin ana akarsuyu"),
  "pontus-trebizond": river("Değirmendere", "Trabzon'un başlıca kıyı vadilerinden biri"),

  "eastern-anatolia-erzincan": river("Karasu", "Fırat'ın batı kolu ve Erzincan ovasının ana nehri"),
  "eastern-anatolia-erzurum": river("Aras", "Erzurum–Aras havzasının ana nehri"),

  "cilicia-sis": river("Ceyhan", "Kilikya'nın doğu ovasındaki ana nehir sistemi"),
  "cilicia-tarsos": river("Berdan Çayı", "Tarsus ovasının tarihsel ana akarsuyu"),
  "cilicia-alaiye": river("Dim Çayı", "Alaiye çevresindeki başlıca kıyı akarsularından biri"),
});

export function getAnatolia1300Hydrography(provinceId) {
  return ANATOLIA_1300_PROVINCE_HYDROGRAPHY[provinceId] ?? null;
}
