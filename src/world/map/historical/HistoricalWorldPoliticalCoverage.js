/**
 * 1300 world political coverage.
 *
 * Historical GIS polygons are the geometry authority. This resolver only maps
 * source labels to vetted Historia polity identities; it never falls back to
 * a modern country owner. Unknown source labels remain visibly covered by the
 * historical neutral presentation until explicitly researched.
 */

import { getHistoricalWorldPolity } from "../../../world/historical/HistoricalWorld1300Registry.js";
import { HISTORICAL_NEUTRAL_POLITY } from "./HistoricalPoliticalPresentation.js";

const COLORS = Object.freeze({
  byzantium: "#6A1B9A",
  ottomans: "#0F7A32",
  karasi: "#B87333",
  saruhan: "#786A9D",
  mentese: "#3E7C59",
  germiyan: "#8C5A2B",
  hamid: "#4F8065",
  esref: "#7B6840",
  sahibata: "#806A4A",
  inanc: "#5E8C61",
  karaman: "#A33F3F",
  candar: "#7A6A3A",
  trebizond: "#4A7896",
  cilicia: "#8B4A62",
  ilkhanate: "#3D73B9",
  mamluks: "#8C3F63",
  "golden-horde": "#B38B2E",
  chagatai: "#657A4A",
  yuan: "#4B6F8F",
  delhi: "#8A5A3B",
  hoysala: "#5A8064",
  pandya: "#7B4F6A",
  majapahit: "#6F5A3C",
  khmer: "#7D6A3F",
  goryeo: "#4D7088",
  kamakura: "#7A514D",
  france: "#496B8A",
  england: "#7A4F59",
  "holy-roman-empire": "#6D6755",
  aragon: "#8A663B",
  castile: "#9A6B3D",
  portugal: "#4E7860",
  serbia: "#6B536F",
  bulgaria: "#756046",
  venice: "#7C5C42",
  mali: "#806342",
  ethiopia: "#5C7050",
});

const ALIASES = [
  [/byzant|eastern roman|romai/i, "byzantium"],
  [/osman|ottoman/i, "ottomans"],
  [/karasi/i, "karasi"],
  [/saruhan/i, "saruhan"],
  [/mente[sş]|mentese/i, "mentese"],
  [/germiyan/i, "germiyan"],
  [/hamid/i, "hamid"],
  [/esref|eşref/i, "esref"],
  [/s[aâ]hib ata|sahibata/i, "sahibata"],
  [/inanc|inanç|denizli/i, "inanc"],
  [/karaman/i, "karaman"],
  [/candar|çobanoğlu|cobanoglu/i, "candar"],
  [/trebizond|trapezunt/i, "trebizond"],
  [/cilicia|armenian kingdom|armenian state/i, "cilicia"],
  [/ilkhan|il-khan/i, "ilkhanate"],
  [/mamluk/i, "mamluks"],
  [/golden horde|kipchak/i, "golden-horde"],
  [/chagatai|chaghatay/i, "chagatai"],
  [/yuan|great yuan/i, "yuan"],
  [/delhi|khalji/i, "delhi"],
  [/hoysala/i, "hoysala"],
  [/pandya/i, "pandya"],
  [/majapahit/i, "majapahit"],
  [/khmer/i, "khmer"],
  [/goryeo|koryo/i, "goryeo"],
  [/kamakura|japan|nippon/i, "kamakura"],
  [/france|franks/i, "france"],
  [/england|english/i, "england"],
  [/holy roman|german kingdom|german empire/i, "holy-roman-empire"],
  [/aragon/i, "aragon"],
  [/castile|castilla/i, "castile"],
  [/portugal/i, "portugal"],
  [/serbia/i, "serbia"],
  [/bulgaria/i, "bulgaria"],
  [/venice|venetian/i, "venice"],
  [/mali/i, "mali"],
  [/ethiopia|abyssinia|solomonic/i, "ethiopia"],
];

function sourceText(geometry) {
  return [
    geometry?.metadata?.subject,
    geometry?.metadata?.name,
    geometry?.metadata?.sourceName,
  ].filter(Boolean).join(" ").trim();
}

export function resolveHistoricalWorldPolityId(geometry) {
  const text = sourceText(geometry);
  for (const [pattern, polityId] of ALIASES) {
    if (pattern.test(text)) return polityId;
  }
  return "local_polities";
}

export function createHistoricalWorldPoliticalPresentation(geometry) {
  const id = resolveHistoricalWorldPolityId(geometry);
  if (id === "local_polities") {
    return Object.freeze({
      ...HISTORICAL_NEUTRAL_POLITY,
      name: geometry?.metadata?.name
        ? `Unresolved historical polity — ${geometry.metadata.name}`
        : HISTORICAL_NEUTRAL_POLITY.name,
    });
  }

  const registryPolity = getHistoricalWorldPolity(id);
  return Object.freeze({
    id,
    name: registryPolity?.name ?? id,
    type: "polity",
    timeModel: "historical",
    sourceType: "historical-runtime",
    color: COLORS[id] ?? HISTORICAL_NEUTRAL_POLITY.color,
    terrainColor: COLORS[id] ?? HISTORICAL_NEUTRAL_POLITY.terrainColor,
  });
}

export function getHistoricalWorldCoverageStatus(geometry) {
  const id = resolveHistoricalWorldPolityId(geometry);
  return {
    polityId: id,
    covered: true,
    sourceDerived: id !== "local_polities",
    unresolved: id === "local_polities",
    borderPrecision: geometry?.metadata?.borderPrecision ?? geometry?.header?.borderPrecision ?? null,
  };
}
