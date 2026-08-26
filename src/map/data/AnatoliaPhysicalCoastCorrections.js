/**
 * Physical-coast corrections for details omitted by the lightweight mainland
 * atlas. These are land geometries, not political fallbacks. They participate
 * in the same physical-land authority used by province generation.
 */

export const ANATOLIA_PHYSICAL_COAST_CORRECTIONS = Object.freeze([
  {
    id: "sinop-peninsula",
    reason: "The lightweight Black Sea mainland outline does not resolve the Sinop peninsula.",
    coordinates: [
      [34.82, 41.62],
      [34.98, 41.76],
      [35.10, 41.90],
      [35.16, 42.02],
      [35.28, 42.10],
      [35.42, 42.08],
      [35.52, 41.98],
      [35.48, 41.84],
      [35.34, 41.72],
      [35.18, 41.60],
      [35.02, 41.54],
      [34.82, 41.62],
    ],
  },
  {
    id: "iznik-nicaea-northwest-land",
    reason: "The lightweight mainland mask and generated Iznik lake polygon leave the historical Nicaea anchor on a coarse water-side boundary; this small terrestrial reconciliation preserves the historical city approach without weakening the global water exclusion rule.",
    coordinates: [
      [29.64, 40.47],
      [29.72, 40.49],
      [29.80, 40.47],
      [29.86, 40.42],
      [29.82, 40.36],
      [29.74, 40.34],
      [29.66, 40.37],
      [29.62, 40.43],
      [29.64, 40.47],
    ],
  },
]);