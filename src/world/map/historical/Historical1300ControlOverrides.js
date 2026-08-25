/**
 * Source-verified 1300 political corrections.
 *
 * The province metadata intentionally remains conservative. This table is the
 * dated authority used by the 1300 runtime after historical-source review.
 * `controllerAt1300: null` is retained only where the evidence supports
 * suzerainty/contestation rather than direct sovereign control; the renderer
 * still receives a complete visual fill for those areas.
 */

export const VERIFIED_1300_CONTROL_OVERRIDES = Object.freeze({
  "ionia-ayasuluk": Object.freeze({
    statusAt1300: "Byzantine-coastal-before-1304",
    confidence: "high",
    controllerAt1300: "byzantium",
    startYear: null,
    note: "Ayasuluk was taken by Sasa Bey in 1304; the 1 January 1300 frame therefore remains Byzantine before that conquest.",
  }),
  "lydia-birgi": Object.freeze({
    statusAt1300: "Byzantine-frontier-before-1304",
    confidence: "high",
    controllerAt1300: "byzantium",
    startYear: null,
    note: "Birgi was taken by Sasa Bey around 1304 and by Mehmed Bey in 1307; it is not Aydinid in the 1300 start frame.",
  }),
  "phrygia-denizli": Object.freeze({
    statusAt1300: "established-local-emirate",
    confidence: "high",
    controllerAt1300: "inanc",
    startYear: 1292,
    note: "İnanç Bey was appointed to Denizli in 1292 and remained the local ruler; the beyliği is attested through this period.",
  }),
  "phrygia-uluborlu": Object.freeze({
    statusAt1300: "established-emirate",
    confidence: "medium",
    controllerAt1300: "hamid",
    startYear: 1297,
    note: "Hamid Bey established his beylik with Uluborlu as its governmental centre around 1297; later 1301 inscriptions reinforce the local continuity.",
  }),
  "pisidia-egirdir": Object.freeze({
    statusAt1300: "Hamidid-domain",
    confidence: "medium",
    controllerAt1300: "hamid",
    startYear: 1297,
    note: "Eğirdir belongs to the Hamidid Isparta-Burdur-Eğirdir sphere; the exact frontier is approximate, but leaving it visually unassigned would be misleading.",
  }),
  "phrygia-afyon": Object.freeze({
    statusAt1300: "established-local-beylik",
    confidence: "medium",
    controllerAt1300: "sahibata",
    startYear: 1275,
    note: "Sâhib Ataoğulları held the Afyonkarahisar/Karahisar-ı Sâhib area as a distinct local beylik in the period 1275-1341.",
  }),
  "pontus-kastamon": Object.freeze({
    statusAt1300: "Cobanoid-local-rule",
    confidence: "high",
    controllerAt1300: "cobanid",
    startYear: null,
    note: "Kastamonu remained in the Çobanoğulları sphere until Candarid Süleyman's later conquest; Yaman Candar's initial grant was Eflani and he remained there until around 1308.",
  }),
});

export function getVerified1300Control(provinceId) {
  return VERIFIED_1300_CONTROL_OVERRIDES[provinceId] ?? null;
}
