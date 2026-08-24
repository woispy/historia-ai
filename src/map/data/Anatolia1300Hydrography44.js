/** 1300 hydrography additions for the six-province expansion. */

import { ANATOLIA_1300_PROVINCE_HYDROGRAPHY } from "./Anatolia1300Hydrography.js";

const river = (name, detail = null) => Object.freeze({ name, detail });

export const ANATOLIA_1300_PROVINCE_HYDROGRAPHY_44 = Object.freeze({
  ...ANATOLIA_1300_PROVINCE_HYDROGRAPHY,
  "pamphylia-attaleia": river("Düden Çayı", "Attaleia'nın doğusundan Akdeniz'e ulaşan başlıca kıyı akarsuyu"),
  "lycia-myra": river("Myros / Demre Çayı", "Myra'nın bulunduğu alüvyal ova ve tarihsel nehir vadisi"),
  "pisidia-antioch": river("Anthios / Yalvaç Çayı", "Pisidian Antioch çevresindeki yerel vadi sistemi"),
  "cappadocia-nigde": river("Melendiz Çayı", "Niğde–Tyana havzasının önemli akarsu sistemi"),
  "eastern-anatolia-malatya": river("Fırat (Euphrates)", "Malatya çevresindeki doğu Anadolu nehir koridoru"),
  "cilicia-adana": river("Seyhan (Sarus)", "Adana ovasının ana nehri ve Kilikya'nın başlıca ulaşım koridorlarından biri"),
});

export function getAnatolia1300Hydrography44(provinceId) {
  return ANATOLIA_1300_PROVINCE_HYDROGRAPHY_44[provinceId] ?? null;
}
