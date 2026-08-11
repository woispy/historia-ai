/**
 * Historia AI — 1300 historical world anchor registry.
 *
 * This is deliberately a research/placement registry, not a claim that every
 * medieval frontier was a surveyed modern border. `boundaryConfidence` tells
 * later GIS work how aggressively a polygon may be drawn.
 */

export const HISTORICAL_WORLD_1300 = Object.freeze({
  date: "1300-01-01",
  mapConvention: "historical-political-control",
  polities: [
    { id: "byzantium", name: "Byzantine Empire", region: "eastern-mediterranean", boundaryConfidence: "medium" },
    { id: "ottomans", name: "Osmanoğulları", region: "northwestern-anatolia", boundaryConfidence: "low" },
    { id: "karasi", name: "Karesioğulları", region: "northwestern-anatolia", boundaryConfidence: "medium" },
    { id: "saruhan", name: "Saruhanoğulları", region: "western-anatolia", boundaryConfidence: "medium" },
    { id: "aydin", name: "Aydınoğulları", region: "western-anatolia", boundaryConfidence: "medium" },
    { id: "mentese", name: "Menteşeoğulları", region: "southwestern-anatolia", boundaryConfidence: "medium" },
    { id: "germiyan", name: "Germiyanoğulları", region: "central-western-anatolia", boundaryConfidence: "medium" },
    { id: "hamid", name: "Hamidoğulları", region: "southwestern-anatolia", boundaryConfidence: "low" },
    { id: "esref", name: "Eşrefoğulları", region: "lake-district-anatolia", boundaryConfidence: "low" },
    { id: "sahibata", name: "Sâhib Ataoğulları", region: "south-central-anatolia", boundaryConfidence: "low" },
    { id: "inanc", name: "İnanç Beyliği", region: "denizli-anatolia", boundaryConfidence: "low" },
    { id: "karaman", name: "Karamanoğulları", region: "south-central-anatolia", boundaryConfidence: "medium" },
    { id: "candar", name: "Çobanoğlu / early Candar zone", region: "north-central-anatolia", boundaryConfidence: "low" },
    { id: "trebizond", name: "Empire of Trebizond", region: "pontic-anatolia", boundaryConfidence: "medium" },
    { id: "cilicia", name: "Armenian Kingdom of Cilicia", region: "cilicia", boundaryConfidence: "medium" },
    { id: "ilkhanate", name: "Ilkhanate", region: "iran-mesopotamia-caucasus", boundaryConfidence: "medium" },
    { id: "mamluks", name: "Mamluk Sultanate", region: "egypt-syria", boundaryConfidence: "medium" },
    { id: "golden-horde", name: "Golden Horde", region: "pontic-steppe", boundaryConfidence: "medium" },
    { id: "chagatai", name: "Chagatai Khanate", region: "central-asia", boundaryConfidence: "medium" },
    { id: "yuan", name: "Yuan Dynasty", region: "china-mongolia", boundaryConfidence: "high" },
    { id: "delhi", name: "Delhi Sultanate — Khalji", region: "north-india", boundaryConfidence: "medium" },
    { id: "hoysala", name: "Hoysala Kingdom", region: "south-india", boundaryConfidence: "medium" },
    { id: "pandya", name: "Pandya Kingdom", region: "south-india", boundaryConfidence: "medium" },
    { id: "majapahit", name: "Majapahit", region: "maritime-southeast-asia", boundaryConfidence: "low" },
    { id: "khmer", name: "Khmer Empire", region: "mainland-southeast-asia", boundaryConfidence: "medium" },
    { id: "goryeo", name: "Goryeo", region: "korea", boundaryConfidence: "high" },
    { id: "kamakura", name: "Kamakura Shogunate", region: "japan", boundaryConfidence: "medium" },
    { id: "france", name: "Kingdom of France", region: "western-europe", boundaryConfidence: "medium" },
    { id: "england", name: "Kingdom of England", region: "british-isles", boundaryConfidence: "medium" },
    { id: "holy-roman-empire", name: "Holy Roman Empire", region: "central-europe", boundaryConfidence: "low" },
    { id: "aragon", name: "Crown of Aragon", region: "western-mediterranean", boundaryConfidence: "medium" },
    { id: "castile", name: "Crown of Castile", region: "iberia", boundaryConfidence: "medium" },
    { id: "portugal", name: "Kingdom of Portugal", region: "iberia", boundaryConfidence: "high" },
    { id: "serbia", name: "Kingdom of Serbia", region: "balkans", boundaryConfidence: "medium" },
    { id: "bulgaria", name: "Second Bulgarian Empire", region: "balkans", boundaryConfidence: "medium" },
    { id: "venice", name: "Republic of Venice", region: "adriatic-eastern-mediterranean", boundaryConfidence: "medium" },
    { id: "mali", name: "Mali Empire", region: "west-africa", boundaryConfidence: "low" },
    { id: "ethiopia", name: "Solomonic Ethiopia", region: "horn-of-africa", boundaryConfidence: "low" },
  ],

  cityAnchors: [
    ["Constantinople", 28.9784, 41.0082],
    ["Adrianople", 26.5556, 41.6772],
    ["Nicaea", 29.7183, 40.4286],
    ["Nicomedia", 29.9169, 40.7654],
    ["Prusa", 29.0611, 40.1917],
    ["Sinope", 35.1550, 42.0231],
    ["Trebizond", 39.7167, 41.0010],
    ["Konya", 32.4925, 37.8746],
    ["Kütahya", 29.9833, 39.4167],
    ["Magnesia", 27.4289, 38.6191],
    ["Smyrna", 27.1428, 38.4237],
    ["Mylasa", 27.7833, 37.3167],
    ["Tabriz", 46.2919, 38.0800],
    ["Baghdad", 44.3661, 33.3152],
    ["Damascus", 36.2913, 33.5138],
    ["Aleppo", 37.1612, 36.2021],
    ["Cairo", 31.2357, 30.0444],
    ["Jerusalem", 35.2137, 31.7683],
    ["Tbilisi", 44.8271, 41.7151],
    ["Samarkand", 66.9597, 39.6542],
    ["Bukhara", 64.4286, 39.7747],
    ["Delhi", 77.1025, 28.7041],
    ["Dadu", 116.4074, 39.9042],
    ["Hangzhou", 120.1551, 30.2741],
    ["Kyoto", 135.7681, 35.0116],
    ["Kaesong", 126.5595, 37.9708],
    ["Mali core", -8.0, 14.5],
  ].map(([name, x, y]) => ({ name, x, y })),
});

export function getHistoricalWorldPolity(id) {
  return HISTORICAL_WORLD_1300.polities.find((polity) => polity.id === id) ?? null;
}

export function getHistoricalWorldCity(name) {
  return HISTORICAL_WORLD_1300.cityAnchors.find((city) => city.name === name) ?? null;
}
