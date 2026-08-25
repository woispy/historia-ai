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
]);
