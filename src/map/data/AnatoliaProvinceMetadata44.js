/**
 * Historia AI — 1300 Anatolia province expansion (44-province authority).
 *
 * The existing 38-province set remains intact. These six historically useful
 * anchors complete the southern/inner Anatolian coverage that was previously
 * left as oversized residual cells: Attaleia, Myra, Pisidian Antioch, Nigde,
 * Malatya and Adana.
 *
 * Political ownership is deliberately cautious at 1300. These are geographic
 * province identities, not modern cadastral claims.
 */

import { ANATOLIA_PROVINCE_METADATA } from "./AnatoliaProvinceMetadata.js";

const expansionProvince = (id, name, cityId, regionId, countryId, centroid, options = {}) => ({
  id,
  name,
  cityId,
  regionId,
  countryId,
  centroid,
  coastal: false,
  terrain: "plains",
  borderConfidence: "low",
  strategic: false,
  port: false,
  historicalControl: {
    statusAt1300: "contested",
    confidence: "low",
    controllerAt1300: null,
    startYear: null,
    note: null,
  },
  ...options,
});

export const ANATOLIA_1300_PROVINCE_EXPANSION = Object.freeze([
  expansionProvince(
    "pamphylia-attaleia",
    "Attaleia",
    "attaleia",
    "pamphylia",
    null,
    [30.70, 36.89],
    {
      coastal: true,
      port: true,
      terrain: "coastal-plain",
      strategic: true,
      borderConfidence: "medium",
      historicalControl: {
        statusAt1300: "local-seljuk-frontier",
        confidence: "medium",
        controllerAt1300: null,
        startYear: 1207,
        note: "Attaleia had been incorporated into the Seljuk sphere in 1207; the later Teke beylik should not be projected backward to 1300.",
      },
    },
  ),
  expansionProvince(
    "lycia-myra",
    "Myra",
    "myra",
    "lycia",
    null,
    [29.99, 36.26],
    {
      coastal: true,
      port: false,
      terrain: "coastal-hills",
      strategic: true,
      borderConfidence: "low",
      historicalControl: {
        statusAt1300: "fragmented-frontier",
        confidence: "low",
        controllerAt1300: null,
        startYear: null,
        note: "The Lycian coast was a fragmented frontier; no later Teke or Menteshe boundary is projected backward as a precise 1300 border.",
      },
    },
  ),
  expansionProvince(
    "pisidia-antioch",
    "Pisidian Antioch",
    "pisidian-antioch",
    "pisidia",
    null,
    [31.18, 38.30],
    {
      terrain: "highland",
      strategic: true,
      borderConfidence: "low",
      historicalControl: {
        statusAt1300: "fragmented-frontier",
        confidence: "low",
        controllerAt1300: null,
        startYear: null,
        note: "A geographic Pisidian anchor is retained without asserting a clean beylik boundary at the 1300 start date.",
      },
    },
  ),
  expansionProvince(
    "cappadocia-nigde",
    "Niğde",
    "nigde",
    "cappadocia",
    null,
    [34.68, 37.97],
    {
      terrain: "highland",
      strategic: true,
      borderConfidence: "medium",
      historicalControl: {
        statusAt1300: "Ilkhanid-suzerainty",
        confidence: "medium",
        controllerAt1300: null,
        startYear: 1243,
        note: "Niğde remained in the Mongol/Ilkhanid political sphere after Kösedağ; later Karamanoğlu control is not projected backward to 1300.",
      },
    },
  ),
  expansionProvince(
    "eastern-anatolia-malatya",
    "Malatya",
    "malatya",
    "eastern-anatolia",
    null,
    [38.35, 38.35],
    {
      terrain: "river-valley",
      strategic: true,
      borderConfidence: "medium",
      historicalControl: {
        statusAt1300: "Ilkhanid-frontier",
        confidence: "medium",
        controllerAt1300: null,
        startYear: 1244,
        note: "Malatya remained under Ilkhanid administration in the early fourteenth century; the Mamluk conquest belongs to 1315.",
      },
    },
  ),
  expansionProvince(
    "cilicia-adana",
    "Adana",
    "adana",
    "cilicia",
    "cilicia",
    [35.32, 37.00],
    {
      terrain: "coastal-plain",
      strategic: true,
      borderConfidence: "medium",
      historicalControl: {
        statusAt1300: "established-kingdom",
        confidence: "high",
        controllerAt1300: "cilicia",
        startYear: 1198,
        note: "Adana remained within the Armenian Kingdom of Cilicia at the 1300 start; the later Ramadanid emirate is anachronistic here.",
      },
    },
  ),
]);

export const ANATOLIA_PROVINCE_METADATA_44 = Object.freeze([
  ...ANATOLIA_PROVINCE_METADATA,
  ...ANATOLIA_1300_PROVINCE_EXPANSION,
]);

export const ANATOLIA_PROVINCE_BY_ID_44 = Object.freeze(
  Object.fromEntries(ANATOLIA_PROVINCE_METADATA_44.map((item) => [item.id, item])),
);

export function getProvinceMetadata44(id) {
  return ANATOLIA_PROVINCE_BY_ID_44[id] ?? null;
}

export function getProvinceMetadata44ForCity(cityId) {
  return ANATOLIA_PROVINCE_METADATA_44.find((item) => item.cityId === cityId) ?? null;
}
