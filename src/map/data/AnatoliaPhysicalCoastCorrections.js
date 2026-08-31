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
    id: "nicomedia-izmit-control",
    reason: "The lightweight Marmara mainland mask does not resolve the historical Nicomedia terrestrial control site; preserve the site as a minimal physical-land correction without expanding the coarse water boundary.",
    coordinates: [[29.88, 40.67], [29.94, 40.67], [29.96, 40.74], [29.90, 40.75], [29.88, 40.67]],
    controlPoints: [[29.92, 40.705]],
    landControlPoints: [[29.92, 40.705]],
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
    reason: "The coarse Anatolia mainland ring follows the northern Marmara and Black Sea coast without subtracting European Thrace; exclude the European landmass from the Anatolia physical-land authority while leaving the Bosphorus and Anatolian anchors available to explicit corrections. The southern boundary follows the European Marmara-facing shoreline more closely so it does not consume the Anatolian southern-Marmara coast.",
    coordinates: [],
    controlPoints: [],
    landControlPoints: [],
    exclusionCoordinates: [[
      [25.45, 42.35], [29.82, 42.35], [29.82, 40.82], [29.48, 40.88],
      [29.10, 40.82], [28.70, 40.72], [28.28, 40.78], [27.84, 40.70],
      [27.42, 40.65], [27.00, 40.58], [26.62, 40.58], [26.45, 40.48],
      [26.30, 40.55], [26.05, 40.70], [25.70, 41.05], [25.45, 41.35],
      [25.45, 42.35],
    ]],
  },
  {
    id: "bosphorus-european-shore-exclusion",
    reason: "The first Thrace exclusion intentionally stops at the northern Marmara water line; this second exclusion removes the remaining European shore wedge around the Bosphorus/Izmit-facing edge of the coarse mainland ring.",
    coordinates: [],
    controlPoints: [],
    landControlPoints: [],
    exclusionCoordinates: [[
      [28.20, 41.95], [29.55, 41.95], [29.55, 40.90], [29.48, 40.88],
      [29.10, 40.82], [28.70, 40.72], [28.28, 40.64], [28.20, 40.78],
      [28.20, 41.95],
    ]],
  },
  {
    id: "marmara-bosphorus-transition-exclusion",
    reason: "The coarse mainland ring still includes the European-facing Marmara/Bosphorus transition inside the Anatolia physical authority; remove the residual wedge directly rather than modifying province anchors.",
    coordinates: [],
    controlPoints: [],
    landControlPoints: [],
    exclusionCoordinates: [[
      [28.25, 41.25], [29.02, 41.25], [29.02, 40.82], [28.90, 40.76],
      [28.62, 40.68], [28.34, 40.64], [28.25, 40.72], [28.25, 41.25],
    ]],
  },
  {
    id: "south-marmara-anatolian-coast-exclusion",
    reason: "The coarse mainland ring still exposes the Marmara-facing Anatolian coastal shelf as physical land where the 1300 province partition must stop at the southern Marmara shoreline.",
    coordinates: [],
    controlPoints: [[27.88, 39.65]],
    landControlPoints: [[27.88, 39.65]],
    exclusionCoordinates: [[
      [27.70, 40.56], [27.92, 40.66], [28.20, 40.78], [28.44, 40.92],
      [28.58, 41.06], [28.40, 41.12], [28.10, 41.02], [27.82, 40.90],
      [27.58, 40.76], [27.36, 40.62], [27.40, 40.50], [27.56, 40.54],
      [27.70, 40.56],
    ]],
  },
  {
    id: "mysia-balikesir-marmara-land",
    reason: "The lightweight Anatolia mainland ring overextends into the southern Marmara coastline; trim the coarse mainland with an explicit water exclusion while preserving the terrestrial Balıkesir control site. The exclusion shoreline is kept just seaward of the coarse atlas shoreline so shared boundary vertices remain authoritative land.",
    coordinates: [],
    controlPoints: [[27.88, 39.65]],
    landControlPoints: [[27.88, 39.65]],
    exclusionCoordinates: [[
      [26.90, 40.21], [27.12, 40.31], [27.34, 40.43], [27.60, 40.56],
      [27.88, 40.69], [28.12, 40.79], [28.26, 40.87], [28.20, 40.97],
      [27.96, 40.93], [27.72, 40.83], [27.46, 40.71], [27.22, 40.59],
      [27.02, 40.45], [26.88, 40.31], [26.90, 40.21],
    ]],
  },
]);