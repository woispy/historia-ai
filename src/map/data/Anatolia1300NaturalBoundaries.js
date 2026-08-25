/**
 * Historia AI — 1300 Anatolia natural-boundary anchors.
 *
 * These are interpretive cartographic constraints, not cadastral claims.
 * Geometry remains owned by the physical atlas and curated province geometry.
 */

const boundary = (summary, features) => Object.freeze({ summary, features: Object.freeze(features) });

export const ANATOLIA_1300_NATURAL_BOUNDARIES = Object.freeze({
  "bithynia-nicomedia": boundary("İzmit Körfezi ile Samanlı Dağları arasındaki dar geçiş kuşağı", ["İzmit Körfezi", "Samanlı Dağları"]),
  "bithynia-nicaea": boundary("İznik Gölü havzası ve çevre dağları", ["İznik Gölü", "Samanlı Dağları"]),
  "bithynia-prusa": boundary("Marmara kıyısı ile Uludağ arasındaki eşik", ["Marmara", "Uludağ"]),
  "bithynia-sangarios": boundary("Sakarya vadisi ve çevresindeki yüksek arazi", ["Sakarya vadisi"]),
  "phrygia-sogut": boundary("Sakarya havzasının güneyindeki engebeli frontier", ["Sakarya havzası", "Bilecik–Söğüt yüksekleri"]),
  "phrygia-bilecik": boundary("Sakarya vadisi ile İç Batı Anadolu arasındaki geçiş kuşağı", ["Sakarya vadisi", "Bilecik yüksekleri"]),
  "phrygia-eskisehir": boundary("Porsuk vadisi ve çevre platosu", ["Porsuk vadisi", "Türkmen Dağı"]),
  "mysia-balikesir": boundary("Mysia'nın iç ovaları ile Ege geçişleri", ["Mysia ovaları"]),
  "mysia-pergamon": boundary("Bakırçay havzası ile Madra Dağları arasındaki alan", ["Bakırçay havzası", "Madra Dağları"]),
  "lydia-magnesia": boundary("Gediz vadisi ve Spil Dağı eşiği", ["Gediz vadisi", "Spil Dağı"]),
  "lydia-smyrna": boundary("İzmir Körfezi ve Gediz'in batı kıyı ovası", ["İzmir Körfezi", "Gediz"]),
  "ionia-ayasuluk": boundary("Küçük Menderes vadisi ile Ege kıyısı", ["Küçük Menderes", "Ege kıyısı"]),
  "caria-tralleis": boundary("Büyük Menderes vadisi ve Aydın Dağları", ["Büyük Menderes", "Aydın Dağları"]),
  "caria-mylasa": boundary("Karia'nın dağlık iç kesimleri ile kıyı geçişleri", ["Latmos Dağları"]),
  "caria-halikarnassos": boundary("Bodrum yarımadasının kıyı ve tepelik arazi sistemi", ["Ege kıyısı", "Karia tepeleri"]),
  "phrygia-denizli": boundary("Lykos vadisi ile Batı Toros geçişleri", ["Lykos vadisi"]),
  "phrygia-uluborlu": boundary("Göller Bölgesi'nin yüksek havzaları", ["Göller Bölgesi", "Toroslar"]),
  "pisidia-egirdir": boundary("Eğirdir Gölü havzası ve Batı Toroslar", ["Eğirdir Gölü", "Batı Toroslar"]),
  "phrygia-afyon": boundary("İç Batı Anadolu'nun yüksek geçiş düğümü", ["Sultan Dağları", "Afyon yüksekleri"]),
  "pisidia-beysehir": boundary("Beyşehir Gölü havzası ve Batı Toroslar", ["Beyşehir Gölü", "Batı Toroslar"]),
  "phrygia-kutahya": boundary("İç Batı Anadolu yüksekleri ve Murat Dağı eşiği", ["Murat Dağı", "İç Batı Anadolu yüksekleri"]),
  "galatia-ankara": boundary("İç Anadolu platosunun kuzey-güney geçiş kuşağı", ["İç Anadolu platosu"]),
  "cappadocia-kayseri": boundary("Erciyes çevresindeki volkanik yüksek arazi", ["Erciyes", "Kapadokya platosu"]),
  "cappadocia-sivas": boundary("Kızılırmak havzası ile yüksek plato", ["Kızılırmak havzası", "İç Anadolu platosu"]),
  "lycaonia-konya": boundary("Konya Ovası ve güneydeki Toros eşiği", ["Konya Ovası", "Toroslar"]),
  "lycaonia-larende": boundary("Larende'nin kuzeyindeki plato ile Orta Toros geçişleri", ["Orta Toroslar", "Toros geçitleri"]),
  "pontus-sinop": boundary("Sinop yarımadası ile İsfendiyar Dağları", ["Karadeniz", "İsfendiyar Dağları"]),
  "pontus-amisos": boundary("Karadeniz kıyı ovası ile Canik dağ kuşağı", ["Karadeniz", "Canik Dağları"]),
  "pontus-amasya": boundary("Yeşilırmak vadisi ve onu çevreleyen dağlar", ["Yeşilırmak", "Canik Dağları"]),
  "pontus-kastamon": boundary("Küre–Ilgaz dağlık kuşağı", ["Küre Dağları", "Ilgaz Dağları"]),
  "pontus-trebizond": boundary("Doğu Karadeniz kıyısı ile kıyıya paralel dağ kuşağı", ["Karadeniz", "Doğu Karadeniz Dağları"]),
  "eastern-anatolia-erzincan": boundary("Erzincan havzası ve Munzur çevresi", ["Karasu/Fırat havzası", "Munzur Dağları"]),
  "eastern-anatolia-erzurum": boundary("Erzurum platosu ve Palandöken kuşağı", ["Erzurum Ovası", "Palandöken Dağları"]),
  "cilicia-sis": boundary("Kilikya kapıları ve Toros geçişleri", ["Toroslar", "Kilikya geçitleri"]),
  "cilicia-tarsos": boundary("Çukurova ovası ile Berdan vadisi", ["Çukurova", "Berdan"]),
  "cilicia-alaiye": boundary("Alanya kıyısı ile Batı Torosların denize yaklaşan kuşağı", ["Akdeniz", "Batı Toroslar"]),
});

export function getAnatolia1300NaturalBoundary(provinceId) {
  return ANATOLIA_1300_NATURAL_BOUNDARIES[provinceId] ?? null;
}
