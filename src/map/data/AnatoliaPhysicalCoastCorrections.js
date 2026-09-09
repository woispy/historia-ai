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
    id: "kocaeli-north-marmara-shore",
    reason: "The lightweight mainland outline collapses the narrow physical land between the Gulf of Izmit and the Black Sea; this correction restores that real mainland shore without using political borders.",
    coordinates: [
      [29.20, 40.83],
      [29.35, 40.90],
      [29.55, 40.96],
      [29.80, 40.98],
      [30.05, 40.98],
      [30.25, 40.95],
      [30.42, 40.88],
      [30.50, 40.80],
      [30.45, 40.73],
      [30.25, 40.70],
      [30.05, 40.72],
      [29.85, 40.74],
      [29.65, 40.75],
      [29.45, 40.76],
      [29.25, 40.78],
      [29.20, 40.83],
    ],
  },
  {
    id: "caria-mylasa-coastal-lowland",
    reason: "The lightweight mainland outline is too coarse around the southwest Anatolian coast near ancient Mylasa; this correction restores the physical mainland/coastal-lowland footprint used by the province partition without using a political boundary.",
    coordinates: [
      [27.55, 37.10],
      [27.66, 37.16],
      [27.74, 37.24],
      [27.78, 37.32],
      [27.88, 37.40],
      [28.02, 37.46],
      [28.08, 37.55],
      [28.02, 37.64],
      [27.90, 37.66],
      [27.78, 37.60],
      [27.68, 37.52],
      [27.60, 37.42],
      [27.52, 37.32],
      [27.48, 37.22],
      [27.55, 37.10],
    ],
  },
]);
