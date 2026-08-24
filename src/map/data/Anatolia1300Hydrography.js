/**
 * Historia AI — 1300 Anatolia province hydrography presentation metadata.
 *
 * This is a presentation/inspection layer, not a replacement for the physical
 * river geometry. A province may contain, border, or be strongly identified by
 * a named river even when the current gameplay province model has no river
 * field populated. Names are kept explicit so the inspector never has to infer
 * hydrography from the modern gameplay state.
 */

const river = (name, detail = null) => Object.freeze({ name, detail });

export const ANATOLIA_1300_PROVINCE_HYDROGRAPHY = Object.freeze({
  "bithynia-nicomedia": river("Sangarios havzası", "İzmit Körfezi hinterlandındaki akarsular"),
  "bithynia-nicaea": river("Rhyndacus / Orhaneli–Kocasu sistemi", "İznik Gölü havzası"),
  "bithynia-prusa": river("Nilüfer Çayı", "Olympus eteklerinden Bursa ovasına iner"),

  "bithynia-sangarios": river("Sangarios (Sakarya)", "Ana sınır nehri ve Sakarya koridoru"),
  "phrygia-sogut": river("Sakarya havzası", "Söğüt çevresindeki üst havza ve kollar"),
  "phrygia-bilecik": river("Sakarya (Sangarios)", "Bilecik çevresindeki derin Sakarya vadisi"),
  "phrygia-eskisehir": river("Porsuk Çayı", "Dorylaion/Eskişehir ovasının ana akarsuyu"),

  "mysia-balikesir": river("Simav Çayı", "Mysia iç kesimlerinin başlıca akarsu sistemi"),
  "mysia-pergamon": river("Bakırçay", "Pergamon ovasının tarihsel Kaikos/Bakırçay sistemi"),

  "lydia-magnesia": river("Gediz (Hermos)", "Magnesia'nın ana vadi koridoru"),
  "lydia-smyrna": river("Meles", "Smyrna çevresindeki tarihsel akarsu"),
  "ionia-ayasuluk": river("Küçük Menderes (Kaystros)", "Ayasuluk/Selçuk çevresindeki ana nehir"),
  "lydia-birgi": river("Küçük Menderes havzası", "Birgi çevresindeki üst vadi sistemi"),
  "caria-tralleis": river("Büyük Menderes (Maiandros)", "Tralleis'in güneyindeki ana vadi sistemi"),

  "caria-mylasa": river("Mandalya Körfezi kıyı akarsuları", "Kıyı ve kısa havza sistemi"),
  "caria-pecin": river("Menteşe kıyı havzası", "Peçin çevresindeki kısa akarsu sistemi"),
  "caria-halikarnassos": river("Halikarnassos kıyı havzası", "Kısa kıyı dereleri"),

  "phrygia-denizli": river("Büyük Menderes", "Denizli/Lâdik ovasının ana vadi sistemi"),
  "phrygia-uluborlu": river("Aksu Çayı", "Pisidia–Uluborlu havzası"),
  "pisidia-egirdir": river("Aksu Çayı", "Eğirdir Gölü–Aksu havza bağlantısı"),
  "phrygia-afyon": river("Akarçay", "Afyon ovasının ana akarsuyu"),
  "pisidia-beysehir": river("Çarşamba Çayı", "Beyşehir Gölü çıkış sistemi"),
  "phrygia-kutahya": river("Porsuk Çayı", "Kütahya ovasından doğuya, Sakarya sistemine akar"),

  "galatia-ankara": river("Ankara Çayı", "Sakarya havzasına bağlanan Ankara vadisi"),
  "cappadocia-kayseri": river("Zamantı Irmağı", "Seyhan sisteminin üst kolları"),
  "cappadocia-sivas": river("Kızılırmak", "Sebasteia/Sivas çevresinin ana nehir sistemi"),
  "lycaonia-konya": river("Çarşamba Çayı", "Konya ovasının önemli batı akarsu sistemi"),
  "lycaonia-larende": river("Göksu havzası", "Taurus geçitleri ve Göksu üst havzası"),

  "pontus-sinop": river("Gökırmak havzası", "Sinop hinterlandına ulaşan iç havza sistemi"),
  "pontus-amisos": river("Kızılırmak", "Amisos/Samsun çevresinde Karadeniz'e ulaşan büyük nehir"),
  "pontus-amasya": river("Yeşilırmak (Iris)", "Amaseia'nın içinden geçen ana nehir"),
  "pontus-kastamon": river("Gökırmak", "Kastamonu–Taşköprü vadisinin ana akarsuyu"),
  "pontus-trebizond": river("Değirmendere", "Trabzon'un başlıca kıyı vadilerinden biri"),

  "eastern-anatolia-erzincan": river("Karasu", "Fırat'ın batı kolu; Erzincan ovasının ana nehri"),
  "eastern-anatolia-erzurum": river("Aras", "Erzurum–Aras havzasının ana nehri"),

  "cilicia-sis": river("Ceyhan", "Kilikya ovasının ana nehir sistemi"),
  "cilicia-tarsos": river("Berdan Çayı", "Tarsus ovasının tarihsel ana akarsuyu"),
  "cilicia-alaiye": river("Dim Çayı", "Alanya çevresinin başlıca kıyı akarsularından biri"),
});

export function getAnatolia1300Hydrography(provinceId) {
  return ANATOLIA_1300_PROVINCE_HYDROGRAPHY[provinceId] ?? null;
}
