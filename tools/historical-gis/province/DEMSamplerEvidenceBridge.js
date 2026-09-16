/**
 * Bridge between the P6.2 Copernicus DEM cost sampler and the candidate-only
 * DEM relief evidence layer used by T3/P6.1.
 *
 * The bridge deliberately keeps the authority boundary explicit:
 * P6.2 sampler -> physical terrain evidence -> candidate graph evidence.
 * It never creates political ownership, canonical borders, or runtime geometry.
 */
import { extractDEMReliefEvidence } from "./DEMReliefEvidence.js";

const METERS_PER_DEGREE = 111000;
const DEFAULT_RADIUS_SAMPLES = 1;
const DEFAULT_SAMPLE_STEP_DEGREES = 1 / 3600;

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${name} must be finite`);
  return number;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, finite(value, "value")));
}

function metresPerLongitudeDegree(lat) {
  return Math.max(1, METERS_PER_DEGREE * Math.cos(lat * Math.PI / 180));
}

function buildElevationGrid(sampler, lon, lat, radiusSamples, stepDegrees) {
  const size = radiusSamples * 2 + 1;
  const elevations = [];
  for (let y = 0; y < size; y += 1) {
    const dy = y - radiusSamples;
    for (let x = 0; x < size; x += 1) {
      const dx = x - radiusSamples;
      elevations.push(sampler.elevation(lon + dx * stepDegrees, lat + dy * stepDegrees));
    }
  }
  const cellSizeMeters = stepDegrees * METERS_PER_DEGREE;
  return { elevations, width: size, height: size, cellSizeMeters };
}

/**
 * Create a synchronous point-evidence provider from an initialized
 * CopernicusDemCostSampler.
 *
 * @param {{elevation:function(lon:number,lat:number):number|null}} sampler
 * @param {{radiusSamples?:number, sampleStepDegrees?:number, reliefScaleMeters?:number, ridgeScaleMeters?:number}} options
 */
export function createDEMSamplerEvidenceProvider(sampler, {
  radiusSamples = DEFAULT_RADIUS_SAMPLES,
  sampleStepDegrees = DEFAULT_SAMPLE_STEP_DEGREES,
  reliefScaleMeters = 500,
  ridgeScaleMeters = 400,
} = {}) {
  if (!sampler || typeof sampler.elevation !== "function") throw new TypeError("sampler.elevation must be a function");
  if (!Number.isInteger(radiusSamples) || radiusSamples < 1) throw new RangeError("radiusSamples must be a positive integer");
  if (!(sampleStepDegrees > 0)) throw new RangeError("sampleStepDegrees must be positive");

  return Object.freeze({
    sample(node) {
      const lon = finite(node?.lon, "node.lon");
      const lat = finite(node?.lat, "node.lat");
      const grid = buildElevationGrid(sampler, lon, lat, radiusSamples, sampleStepDegrees);
      const evidence = extractDEMReliefEvidence(grid, { reliefScaleMeters, ridgeScaleMeters });
      const centerIndex = radiusSamples * (radiusSamples * 2 + 1) + radiusSamples;
      const center = evidence.samples[centerIndex];
      const validCount = evidence.samples.filter((sample) => sample.valid).length;
      const coverage = evidence.samples.length ? validCount / evidence.samples.length : 0;

      if (!center?.valid) {
        return Object.freeze({
          valid: false,
          authoritative: false,
          source: "Copernicus DEM GLO-30",
          coverage: Number(coverage.toFixed(6)),
          slopeNormalized: 0,
          ridgeAffinity: 0,
          mountainResistance: 0,
          reliefMeters: null,
          ridgeProminenceMeters: null,
        });
      }

      return Object.freeze({
        valid: true,
        authoritative: false,
        source: "Copernicus DEM GLO-30",
        coverage: Number(coverage.toFixed(6)),
        elevationMeters: center.elevationMeters,
        slopeNormalized: clamp01(center.slopeNormalized),
        ridgeAffinity: clamp01(center.ridgeAffinity),
        mountainResistance: clamp01(center.mountainResistance),
        reliefMeters: center.reliefMeters,
        ridgeProminenceMeters: center.ridgeProminenceMeters,
      });
    },
  });
}

export const DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT = Object.freeze({
  schemaVersion: 1,
  authoritative: false,
  source: "Copernicus DEM GLO-30",
  input: "initialized P6.2 CopernicusDemCostSampler",
  output: "candidate physical terrain evidence",
  neighbourhood: "3x3 elevation post by default",
  politicalAuthority: false,
});

export const demSamplerEvidenceBridgeDefaults = Object.freeze({
  radiusSamples: DEFAULT_RADIUS_SAMPLES,
  sampleStepDegrees: DEFAULT_SAMPLE_STEP_DEGREES,
  reliefScaleMeters: 500,
  ridgeScaleMeters: 400,
  defaultCellSizeMeters: DEFAULT_SAMPLE_STEP_DEGREES * METERS_PER_DEGREE,
});
