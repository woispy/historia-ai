const COUNTRY_ALIASES = Object.freeze({
  local_polities: ["local polities", "local polity", "unknown", "unmapped"],
  ottomans: ["ottoman", "ottomans", "ottoman beylik", "ottoman emirate"],
  byzantium: ["byzantine empire", "byzantine", "eastern roman empire", "roman empire", "empire of constantinople"],
  germiyan: ["germiyan", "germiyanid beylik", "germiyanids"],
  karasi: ["karasi", "karasi beylik", "karasid beylik"],
  mentese: ["mentese", "menteshe", "menteshe beylik", "mentese beylik"],
  karaman: ["karaman", "karamanid beylik", "karamanids"],
  candar: ["candar", "candarid beylik", "candarids", "isfendiyarids"],
  ilkhanate: ["ilkhanate", "ilkhanids", "il-khanate", "ilhanlılar", "ilhanlı devleti"],
  georgia: ["georgia", "kingdom of georgia", "georgian kingdom"],
  trebizond: ["trebizond", "empire of trebizond", "trapezuntine empire"],
  golden_horde: ["golden horde", "khanate of the golden horde", "ulug ulus"],
  chagatai: ["chagatai", "chagatai khanate", "chaghatay khanate"],
  yuan: ["yuan", "yuan dynasty", "great khanate", "mongol yuan"],
  mamluks: ["mamluks", "mamluk", "mamluke sultanate", "mamluk sultanate"],
  marinids: ["marinids", "marinid sultanate", "marinid kingdom"],
  hafsids: ["hafsids", "hafsid caliphate", "hafsid sultanate"],
  tlemcen: ["tlemcen", "zayyanid kingdom of tlemcen", "zayyanids"],
  granada: ["granada", "nasrid emirate of granada", "emirate of granada"],
  castile: ["castile", "crown of castile", "kingdom of castile"],
  aragon: ["aragon", "crown of aragon", "kingdom of aragon"],
  portugal: ["portugal", "kingdom of portugal"],
  france: ["france", "kingdom of france"],
  england: ["england", "kingdom of england", "english territory"],
  scotland: ["scotland", "kingdom of scotland"],
  hre: ["holy roman empire", "hre"],
  hungary: ["hungary", "kingdom of hungary"],
  bohemia: ["bohemia", "kingdom of bohemia"],
  poland: ["poland", "kingdom of poland"],
  lithuania: ["lithuania", "grand duchy of lithuania"],
  denmark: ["denmark", "kingdom of denmark"],
  sweden: ["sweden", "kingdom of sweden"],
  norway: ["norway", "kingdom of norway"],
  serbia: ["serbia", "kingdom of serbia", "raska", "raška"],
  bulgaria: ["bulgaria", "second bulgarian empire", "bulgarian empire"],
  bosnia: ["bosnia", "banate of bosnia"],
  venice: ["venice", "republic of venice", "venetian republic"],
  genoa: ["genoa", "republic of genoa", "genovese republic"],
  papal_states: ["papal states", "papal state"],
  cyprus: ["cyprus", "kingdom of cyprus"],
  teutonic_order: ["teutonic knights", "teutonic order", "teutonic state"],
  mali: ["mali", "mali empire"],
  kanem: ["kanem", "kanem bornu", "bornu kanem", "bornu-kanem", "kanem empire"],
  ethiopia: ["ethiopia", "ethiopian empire", "abyssinia"],
  kilwa: ["kilwa", "kilwa sultanate"],
  delhi: ["delhi", "delhi sultanate", "sultanate of delhi"],
  pandya: ["pandya", "pandya state", "pandya kingdom"],
  khmer: ["khmer", "khmer empire"],
  champa: ["champa"],
  dai_viet: ["dai viet", "đại việt"],
  sukhothai: ["sukhothai", "sukhothai kingdom"],
  pagan: ["pagan", "pagan kingdom"],
  japan: ["japan", "shogun japan", "shogun japan kamakura", "kamakura japan"],
  goryeo: ["goryeo", "koryo", "goryeo kingdom"],
});

const SPECIAL_LETTER_REPLACEMENTS = Object.freeze([
  [/đ/gi, "d"], [/ð/gi, "d"], [/þ/gi, "th"], [/ł/gi, "l"],
  [/ø/gi, "o"], [/æ/gi, "ae"], [/œ/gi, "oe"],
]);

export function normalizeHistoricalCountryName(value) {
  let normalized = String(value ?? "").normalize("NFKD");
  for (const [pattern, replacement] of SPECIAL_LETTER_REPLACEMENTS) normalized = normalized.replace(pattern, replacement);
  return normalized.replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const aliasIndex = new Map();
for (const [countryId, aliases] of Object.entries(COUNTRY_ALIASES)) {
  for (const alias of [countryId, ...aliases]) {
    const normalized = normalizeHistoricalCountryName(alias);
    if (normalized) aliasIndex.set(normalized, countryId);
  }
}

export function resolveCanonicalHistoricalCountryId(value) {
  return aliasIndex.get(normalizeHistoricalCountryName(value)) ?? null;
}

export function buildHistoricalCountryAliasIndex(countries = {}) {
  const index = new Map(aliasIndex);
  for (const [countryId, country] of Object.entries(countries)) {
    for (const value of [countryId, country?.id, country?.name, country?.title, ...(country?.aliases ?? [])]) {
      const normalized = normalizeHistoricalCountryName(value);
      if (normalized) index.set(normalized, countryId);
    }
  }
  return index;
}

export function resolveHistoricalCountryId(value, countries = {}) {
  const normalized = normalizeHistoricalCountryName(value);
  if (!normalized) return null;
  return buildHistoricalCountryAliasIndex(countries).get(normalized) ?? null;
}

export function getHistoricalCountryAliases() {
  return COUNTRY_ALIASES;
}
