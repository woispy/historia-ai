import { WORLD_LAND_POLYGONS } from "../../physical/WorldPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../data/AnatoliaPhysicalAtlasRuntime.js";

export const WATER_MASK_WIDTH = 2048;
export const WATER_MASK_HEIGHT = 1024;

export const WATER_MASK_CHANNELS = Object.freeze({
  land: 0,
  lake: 1,
  sea: 2,
  valid: 3,
});

export function projectWorldPoint(point, width = WATER_MASK_WIDTH, height = WATER_MASK_HEIGHT) {
  const longitude = Number(point?.[0]);
  const latitude = Number(point?.[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return [
    ((longitude + 180) / 360) * width,
    ((90 - latitude) / 180) * height,
  ];
}

export function drawPolygonPath(ctx, polygon, width, height) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let started = false;
  for (const point of polygon) {
    const projected = projectWorldPoint(point, width, height);
    if (!projected) continue;
    if (!started) {
      ctx.moveTo(projected[0], projected[1]);
      started = true;
    } else {
      ctx.lineTo(projected[0], projected[1]);
    }
  }
  if (!started) return false;
  ctx.closePath();
  return true;
}

function fillPolygons(ctx, polygons, color, width, height) {
  ctx.beginPath();
  let count = 0;
  for (const polygon of polygons ?? []) {
    if (drawPolygonPath(ctx, polygon, width, height)) count += 1;
  }
  if (!count) return 0;
  ctx.fillStyle = color;
  ctx.fill();
  return count;
}

function createCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function buildPhysicalWaterMask({
  width = WATER_MASK_WIDTH,
  height = WATER_MASK_HEIGHT,
  worldLandPolygons = WORLD_LAND_POLYGONS,
  lakes = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes,
  seas = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.seas,
  channels = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.channels,
} = {}) {
  const canvas = createCanvas(width, height);
  if (!canvas) return null;
  const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: false });
  if (!ctx) return null;

  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";
  fillPolygons(ctx, worldLandPolygons, "rgba(255,0,0,1)", width, height);
  fillPolygons(
    ctx,
    lakes.map((lake) => lake.rings?.[0] ?? lake.coordinates).filter(Boolean),
    "rgba(0,255,0,1)",
    width,
    height,
  );
  fillPolygons(
    ctx,
    [...seas, ...channels].map((feature) => feature.coordinates).filter(Boolean),
    "rgba(0,0,255,1)",
    width,
    height,
  );

  // Alpha is validity, RGB is the shared physical classification contract.
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}

export function physicalMaskClassification({ land, lake, sea }, epsilon = 0.5) {
  const isLand = Number(land) >= epsilon;
  const isLake = Number(lake) >= epsilon;
  const isSea = Number(sea) >= epsilon;
  return Object.freeze({
    isLand,
    isLake,
    isSea,
    isWater: isLake || isSea || !isLand,
    allowsPolitical: isLand && !isLake && !isSea,
    allowsTerrain: isLand && !isLake,
    allowsRiver: isLand && !isLake,
    allowsCoastline: true,
  });
}
