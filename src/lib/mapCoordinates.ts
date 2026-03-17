/**
 * Map coordinate conversion for ground floor plan (1584×2241 image).
 * Image is aligned to BUILDING (architectural) space so rooms match the floor plan.
 * AR coords (tracking/lifts) are mapped to building via linear calibration, then to image.
 */

import { AR_BOUNDS } from "@/data/pinnacleArCoordinates";
import { BUILDING_BOUNDS } from "@/data/heatmapData";

export const FLOOR_IMG_WIDTH = 1584;
export const FLOOR_IMG_HEIGHT = 2241;

/** Cropped viewBox — show the full image (no margins cropped). */
export const FLOOR_CROP_Y = 0;
export const FLOOR_CROP_W = FLOOR_IMG_WIDTH;
export const FLOOR_CROP_H = FLOOR_IMG_HEIGHT;

/** Building (x, z) → image (x, y). Image is in building space so rooms align. */
function buildingToImageDirect(bx: number, bz: number): { x: number; y: number } {
  const x = ((bx - BUILDING_BOUNDS.xMin) / (BUILDING_BOUNDS.xMax - BUILDING_BOUNDS.xMin)) * FLOOR_IMG_WIDTH;
  const y = ((BUILDING_BOUNDS.zMax - bz) / (BUILDING_BOUNDS.zMax - BUILDING_BOUNDS.zMin)) * FLOOR_IMG_HEIGHT;
  return { x, y };
}

/** AR (x, z) → building (x, z) using linear calibration. */
export function arToBuilding(arX: number, arZ: number): { x: number; z: number } {
  const x = BUILDING_BOUNDS.xMin + ((arX - AR_BOUNDS.xMin) / (AR_BOUNDS.xMax - AR_BOUNDS.xMin)) * (BUILDING_BOUNDS.xMax - BUILDING_BOUNDS.xMin);
  const z = BUILDING_BOUNDS.zMin + ((arZ - AR_BOUNDS.zMin) / (AR_BOUNDS.zMax - AR_BOUNDS.zMin)) * (BUILDING_BOUNDS.zMax - BUILDING_BOUNDS.zMin);
  return { x, z };
}

/** AR (x, z) → image (x, y). Used for traffic dots, lifts, cabins. */
export function arToImage(px: number, pz: number): { x: number; y: number } {
  const b = arToBuilding(px, pz);
  return buildingToImageDirect(b.x, b.z);
}

/** Building (x, z) → image (x, y). Use for rooms so they match the floor plan. */
export function buildingToImage(bx: number, bz: number): { x: number; y: number } {
  return buildingToImageDirect(bx, bz);
}

/** Convert AR points [x,z][] to image points. */
export function arPointsToImage(points: [number, number][]): { x: number; y: number }[] {
  return points.map(([px, pz]) => arToImage(px, pz));
}

/** Convert building points [x,z][] to image points. */
export function buildingPointsToImage(points: [number, number][]): { x: number; y: number }[] {
  return points.map(([bx, bz]) => buildingToImage(bx, bz));
}
