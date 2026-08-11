import { ANATOLIA_CITY_ATLAS } from "./AnatoliaCityAtlas";

const point = (cityId) => {
  const city = ANATOLIA_CITY_ATLAS[cityId];
  return [city.x, city.y];
};

export const ANATOLIA_REGION_LABELS = Object.freeze([
  { id: "marmara", name: "MARMARA", x: 28.9, y: 40.85, size: 0.30 },
  { id: "ege", name: "EGE", x: 27.55, y: 38.55, size: 0.28 },
  { id: "ic-anadolu", name: "İÇ ANADOLU", x: 33.0, y: 39.0, size: 0.30 },
  { id: "karadeniz", name: "KARADENİZ", x: 35.3, y: 41.35, size: 0.28 },
  { id: "akdeniz", name: "AKDENİZ", x: 32.4, y: 36.65, size: 0.28 },
  { id: "dogu-anadolu", name: "DOĞU ANADOLU", x: 40.2, y: 39.0, size: 0.27 },
]);

export const ANATOLIA_STRATEGIC_CORRIDORS = Object.freeze([
  {
    id: "constantinople-nicomedia",
    name: "Boğaziçi–İzmit Koridoru",
    className: "strait",
    points: [point("konstantinopolis"), point("nikomedia"), point("iznik"), point("bursa")],
    importance: 5,
  },
  {
    id: "bilecik-kutahya",
    name: "Bilecik–Kütahya Geçişi",
    className: "pass",
    points: [point("bilecik"), point("sogut"), point("eskisehir"), point("kutahya")],
    importance: 4,
  },
  {
    id: "gediz",
    name: "Gediz Vadisi",
    className: "river",
    points: [point("balikesir"), point("bergama"), point("manisa"), point("birgi")],
    importance: 4,
  },
  {
    id: "buyuk-menderes",
    name: "Büyük Menderes Koridoru",
    className: "river",
    points: [point("ayasuluk"), point("aydin"), point("milas")],
    importance: 4,
  },
  {
    id: "phrygian-highland",
    name: "Frigya Yayla Hattı",
    className: "pass",
    points: [point("kutahya"), point("afyon"), point("denizli"), point("uluborlu")],
    importance: 3,
  },
  {
    id: "central-anatolia",
    name: "İç Anadolu Doğu-Batı Hattı",
    className: "land",
    points: [point("eskisehir"), point("ankara"), point("konya"), point("larende")],
    importance: 4,
  },
  {
    id: "pontic-coast",
    name: "Pontus Kıyı Koridoru",
    className: "coast",
    points: [point("kastamonu"), point("sinop"), point("amisos"), point("trabzon")],
    importance: 4,
  },
  {
    id: "cilician-gates",
    name: "Kilikya Kapıları",
    className: "pass",
    points: [point("larende"), point("sis"), point("tarsus")],
    importance: 5,
  },
  {
    id: "eastern-gateway",
    name: "Erzincan–Erzurum Hattı",
    className: "land",
    points: [point("sivas"), point("erzincan"), point("erzurum")],
    importance: 4,
  },
]);

export const ANATOLIA_STRATEGIC_PASSES = Object.freeze([
  { id: "izmit-gate", name: "İzmit Geçidi", ...Object.fromEntries(["x", "y"].map((key) => [key, key === "x" ? 29.72 : 40.45])) },
  { id: "bilecik-pass", name: "Bilecik Geçidi", ...Object.fromEntries(["x", "y"].map((key) => [key, key === "x" ? 30.15 : 40.10])) },
  { id: "eskisehir-gate", name: "Eskişehir Geçidi", ...Object.fromEntries(["x", "y"].map((key) => [key, key === "x" ? 30.75 : 39.72])) },
  { id: "cilician-gates", name: "Kilikya Kapıları", ...Object.fromEntries(["x", "y"].map((key) => [key, key === "x" ? 34.79 : 37.36])) },
  { id: "erzincan-gate", name: "Erzincan Geçidi", ...Object.fromEntries(["x", "y"].map((key) => [key, key === "x" ? 39.0 : 39.72])) },
]);

export const ANATOLIA_STRATEGIC_CROSSINGS = Object.freeze([
  { id: "sakarya-crossing", name: "Sakarya Geçişi", x: 30.55, y: 40.35, river: "Sakarya", importance: 4 },
  { id: "kizilirmak-crossing", name: "Kızılırmak Geçişi", x: 34.55, y: 40.15, river: "Kızılırmak", importance: 4 },
  { id: "yesilirmak-crossing", name: "Yeşilırmak Geçişi", x: 36.05, y: 40.80, river: "Yeşilırmak", importance: 3 },
  { id: "buyuk-menderes-crossing", name: "Büyük Menderes Geçişi", x: 28.45, y: 37.65, river: "Büyük Menderes", importance: 4 },
  { id: "seyhan-crossing", name: "Seyhan Geçişi", x: 35.10, y: 37.15, river: "Seyhan", importance: 3 },
  { id: "cayirhan-crossing", name: "Sakarya Üst Geçişi", x: 31.10, y: 40.20, river: "Sakarya", importance: 3 },
  { id: "firtina-crossing", name: "Doğu Karadeniz Geçişi", x: 40.05, y: 40.85, river: "Kıyı geçişi", importance: 2 },
]);
