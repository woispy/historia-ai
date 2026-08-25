/**
 * Historia AI — 1300 Anatolia province physical-feature metadata.
 *
 * Presentation metadata only. Geometry remains owned by the physical atlas.
 * Entries are deliberately conservative: a feature is listed only when its
 * relationship to the province is a useful historical-geographic anchor.
 */

const feature = (name, detail = null) => Object.freeze({ name, detail });

export const ANATOLIA_1300_PROVINCE_PHYSICAL_FEATURES = Object.freeze({
  "bithynia-nicomedia": Object.freeze({
    mountains: feature("Samanlı Dağları", "Bithynia'nın güneyindeki dağ kuşağı İzmit Körfezi ile iç kesimler arasında doğal bir eşik oluşturur"),
    passes: feature("İzmit geçitleri", "İzmit Körfezi ile Sakarya havzası arasındaki geçiş koridorları"),
  }),
  "bithynia-nicaea": Object.freeze({
    mountains: feature("Samanlı Dağları", "İznik havzasının kuzey ve güneyindeki dağlık kuşak"),
    passes: feature("İznik geçitleri", "İznik havzasını Marmara ve Bithynia içlerine bağlayan geçişler"),
  }),
  "bithynia-prusa": Object.freeze({
    mountains: feature("Uludağ (Olympus)", "Prusa'nın güneyinde yükselen belirgin dağ kütlesi ve doğal savunma eşiği"),
    passes: feature("Bursa geçitleri", "Marmara kıyısı ile İç Batı Anadolu arasındaki dağ geçişleri"),
  }),
  "phrygia-sogut": Object.freeze({
    mountains: feature("Bilecik–Söğüt yüksekleri", "Sakarya havzasının güneyindeki engebeli yüksek arazi"),
    passes: feature("Söğüt geçişleri", "Bilecik, Söğüt ve Eskişehir yönlerini bağlayan frontier geçişleri"),
  }),
  "phrygia-bilecik": Object.freeze({
    mountains: feature("Bilecik yüksekleri", "Sakarya vadisi ile İç Batı Anadolu arasında engebeli geçiş kuşağı"),
    passes: feature("Bilecik geçitleri", "Sakarya vadisinden Söğüt ve Eskişehir yönüne çıkan geçişler"),
  }),
  "phrygia-eskisehir": Object.freeze({
    mountains: feature("Türkmen Dağı", "Eskişehir havzasının güneybatısındaki yüksek arazi"),
    passes: feature("Dorylaion geçişleri", "Porsuk vadisini çevreleyen plato geçişleri"),
  }),
  "mysia-pergamon": Object.freeze({
    mountains: feature("Madra Dağları", "Pergamon ile Ege kıyıları arasındaki belirgin dağ kuşağı"),
    passes: feature("Madra geçitleri", "Mysia içlerinden Ege kıyısına geçiş sağlayan doğal koridorlar"),
  }),
  "lydia-magnesia": Object.freeze({
    mountains: feature("Spil Dağı", "Magnesia'nın güneyinde Gediz vadisine hakim belirgin dağ kütlesi"),
    passes: feature("Spil geçitleri", "Gediz vadisi ile Manisa ovası arasındaki geçişler"),
  }),
  "caria-tralleis": Object.freeze({
    mountains: feature("Aydın Dağları", "Tralleis'in kuzeyindeki dağ kuşağı Büyük Menderes vadisini sınırlar"),
    passes: feature("Menderes vadisi geçişleri", "Büyük Menderes vadisi boyunca doğu-batı hareket koridorları"),
  }),
  "caria-mylasa": Object.freeze({
    mountains: feature("Latmos Dağları", "Karia içlerinde kıyı ile Büyük Menderes havzası arasında yükselen dağlık kuşak"),
    passes: feature("Karia geçitleri", "Mylasa çevresindeki kıyı-iç kesim geçişleri"),
  }),
  "phrygia-afyon": Object.freeze({
    mountains: feature("Sultan Dağları", "Afyon çevresindeki yüksek arazi kuşaklarından biri ve güneybatı-iç Anadolu geçiş eşiği"),
    passes: feature("Afyon geçitleri", "Ege ile İç Anadolu arasındaki önemli kara geçişlerinin düğüm noktası"),
  }),
  "phrygia-kutahya": Object.freeze({
    mountains: feature("Murat Dağı", "Kütahya çevresinin güneybatısındaki yüksek dağ kuşağı"),
    passes: feature("Kütahya geçitleri", "İç Batı Anadolu ile Frigya ve Ege yönlerini bağlayan geçişler"),
  }),
  "pisidia-egirdir": Object.freeze({
    mountains: feature("Dedegöl Dağları", "Eğirdir göl havzasının güneyindeki Toros kuşağı"),
    passes: feature("Pisidia geçitleri", "Göller Bölgesi ile Antalya yönü arasındaki doğal geçişler"),
  }),
  "pisidia-beysehir": Object.freeze({
    mountains: feature("Batı Toroslar", "Beyşehir havzasını güneyden çevreleyen dağ kuşağı"),
    passes: feature("Beyşehir geçitleri", "Göller Bölgesi ile Konya ve Antalya yönlerini bağlayan geçişler"),
  }),
  "galatia-ankara": Object.freeze({
    mountains: feature("Ankara çevresi yüksekleri", "İç Anadolu platosunun kuzey ve güney eşikleri"),
    passes: feature("Ankara geçişleri", "Kuzey Anadolu ile İç Anadolu arasındaki kara bağlantıları"),
  }),
  "lycaonia-konya": Object.freeze({
    mountains: feature("Bozdağlar ve Toros eşiği", "Konya ovasının güneyindeki yüksek arazi kuşağı"),
    passes: feature("Konya geçitleri", "Konya ovasını Kilikya ve Pisidia yönlerine bağlayan geçişler"),
  }),
  "lycaonia-larende": Object.freeze({
    mountains: feature("Orta Toroslar", "Larende'nin güneyindeki Toros kuşağı doğal bir arazi ve ulaşım eşiğidir"),
    passes: feature("Gülek yönü geçişleri", "İç Anadolu ile Kilikya arasındaki Toros geçiş sistemine bağlanır"),
  }),
  "pontus-sinop": Object.freeze({
    mountains: feature("İsfendiyar Dağları", "Sinop yarımadasının güneyinde kıyı ile Anadolu içleri arasında doğal engel"),
    passes: feature("Sinop iç geçitleri", "Karadeniz kıyısı ile Kastamonu içlerini bağlayan sınırlı geçişler"),
  }),
  "pontus-amasya": Object.freeze({
    mountains: feature("Canik Dağları", "Amasya'nın kuzeyindeki dağ kuşağı Yeşilırmak vadisini sınırlar"),
    passes: feature("Amasya geçitleri", "Yeşilırmak vadisi boyunca Karadeniz ile İç Anadolu arasında geçiş sağlar"),
  }),
  "eastern-anatolia-erzincan": Object.freeze({
    mountains: feature("Munzur Dağları", "Erzincan havzasının kuzeybatısındaki yüksek dağ kuşağı"),
    passes: feature("Erzincan geçitleri", "Doğu Anadolu'nun kuzey-güney ve doğu-batı ulaşım koridorlarının düğüm noktası"),
  }),
  "eastern-anatolia-erzurum": Object.freeze({
    mountains: feature("Palandöken Dağları", "Erzurum ovasının güneyindeki belirgin yüksek dağ kütlesi"),
    passes: feature("Erzurum geçişleri", "Kafkasya, İran ve Yukarı Fırat yönlerini bağlayan yüksek plato koridorları"),
  }),
});

export function getAnatolia1300PhysicalFeatures(provinceId) {
  return ANATOLIA_1300_PROVINCE_PHYSICAL_FEATURES[provinceId] ?? null;
}
