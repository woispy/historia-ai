/**
 * Physical-coast corrections for details omitted by the lightweight mainland
 * atlas. Corrections can add terrestrial detail or explicitly exclude water
 * that the coarse mainland ring incorrectly includes.
 */

export const ANATOLIA_PHYSICAL_COAST_CORRECTIONS = Object.freeze([
  {
    id: "sinop-peninsula",
    reason: "The lightweight Black Sea mainland outline does not resolve the Sinop peninsula.",
    coordinates: [
      [34.82, 41.62], [34.98, 41.76], [35.10, 41.90], [35.16, 42.02],
      [35.28, 42.10], [35.42, 42.08], [35.52, 41.98], [35.48, 41.84],
      [35.34, 41.72], [35.18, 41.60], [35.02, 41.54], [34.82, 41.62],
    ],
    controlPoints: [],
    exclusionCoordinates: [],
  },
  {
    id: "nicaea-iznik-northshore",
    reason: "The lightweight mainland mask/coarse generated lake geometry resolves the Nicaea shore too coarsely for the historical province geometry anchor.",
    coordinates: [
      [29.58, 40.39], [29.64, 40.36], [29.74, 40.37], [29.82, 40.40],
      [29.86, 40.44], [29.80, 40.47], [29.70, 40.46], [29.60, 40.43], [29.58, 40.39],
    ],
    controlPoints: [[29.69, 40.44]],
    landControlPoints: [
      [29.58, 40.39], [29.64, 40.36], [29.74, 40.37], [29.82, 40.40],
      [29.86, 40.44], [29.80, 40.47], [29.70, 40.46], [29.60, 40.43],
    ],
    exclusionCoordinates: [],
  },
  {
    id: "mentese-pecin-milasa-hinterland",
    reason: "The lightweight Aegean mainland outline is too coarse around the Menteşe coastal interior and does not contain the Peçin/Milasa province control site.",
    coordinates: [
      [27.40, 37.08], [27.48, 37.16], [27.56, 37.25], [27.66, 37.34], [27.80, 37.40],
      [27.90, 37.36], [27.88, 37.26], [27.78, 37.18], [27.66, 37.10], [27.54, 37.02], [27.40, 37.08],
    ],
    controlPoints: [[27.57, 37.27]],
    landControlPoints: [[27.57, 37.27]],
    exclusionCoordinates: [],
  },
  {
    id: "mentese-halikarnassos-control",
    reason: "The lightweight Aegean mainland outline omits the Bodrum/Halikarnassos terrestrial control point; preserve the historical province anchor with a minimal inland physical-land patch rather than expanding the coarse land mask into surrounding sea.",
    coordinates: [[27.42, 37.02], [27.48, 37.04], [27.50, 37.09], [27.43, 37.08], [27.42, 37.02]],
    controlPoints: [[27.43, 37.03]],
    landControlPoints: [[27.43, 37.03]],
    exclusionCoordinates: [],
  },
  {
    id: "pontus-amisos-control",
    reason: "The lightweight Black Sea mainland outline omits the Samsun/Amisos terrestrial control point; preserve the historical province anchor with a minimal inland physical-land patch rather than expanding the coarse land mask into the Black Sea.",
    coordinates: [[36.30, 41.25], [36.38, 41.26], [36.40, 41.34], [36.32, 41.34], [36.30, 41.25]],
    controlPoints: [[36.33, 41.29]],
    landControlPoints: [[36.33, 41.29]],
    exclusionCoordinates: [],
  },
  {
    id: "pontus-kastamon-control",
    reason: "The lightweight Pontus mainland outline resolves the Kastamon hinterland too coarsely for the historical province geometry anchor; preserve the terrestrial site with a minimal physical-land patch.",
    coordinates: [[33.72, 41.32], [33.84, 41.32], [33.88, 41.43], [33.72, 41.44], [33.72, 41.32]],
    controlPoints: [[33.78, 41.38]],
    landControlPoints: [[33.78, 41.38]],
    exclusionCoordinates: [],
  },
  {
    id: "european-thrace-anatolia-exclusion",
    reason: "The coarse Anatolia mainland ring follows the northern Marmara and Black Sea coast without subtracting European Thrace; exclude the European landmass from the Anatolia physical-land authority while leaving the Bosphorus and Anatolian anchors available to explicit corrections.",
    coordinates: [],
    controlPoints: [],
    landControlPoints: [],
    exclusionCoordinates: [[
      [25.45, 42.35], [29.82, 42.35], [29.82, 40.82], [29.48, 40.88],
      [29.10, 40.82], [28.70, 40.72], [28.28, 40.64], [27.84, 40.57],
      [27.42, 40.53], [27.00, 40.50], [26.62, 40.48], [26.45, 40.35],
      [26.30, 40.45], [26.05, 40.70], [25.70, 41.05], [25.45, 41.35],
      [25.45, 42.35],
    ]],
  },
  {
    id: "mysia-balikesir-marmara-land",
    reason: "The lightweight Anatolia mainland ring overextends into the southern Marmara coastline; trim the coarse mainland with an explicit water exclusion while preserving the terrestrial Balıkesir control site.",
    coordinates: [],
    controlPoints: [[27.88, 39.65]],
    landControlPoints: [[27.88, 39.65]],
    exclusionCoordinates: [[
      [26.90, 40.20], [27.12, 40.30], [27.34, 40.42], [27.60, 40.55],
      [27.88, 40.68], [28.12, 40.78], [28.26, 40.86], [28.20, 40.96],
      [27.96, 40.92], [27.72, 40.82], [27.46, 40.70], [27.22, 40.58],
      [27.02, 40.44], [26.88, 40.30], [26.90, 40.20],
    ]],
  },
]);