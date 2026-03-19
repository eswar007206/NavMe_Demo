/**
 * Office - Ground Floor Blueprint
 * Map = coordinate space (game map style).
 * Left → right = X, top → bottom = Y. Every object has (x, y).
 * Building (pos_x, pos_z) from DB is transformed to map (x, y) for SVG.
 */

import type { BuildingOutlinePoint } from "./heatmapData";
import { BUILDING_OUTLINE, BUILDING_BOUNDS } from "./heatmapData";

/** Map coordinate space: same as SVG viewBox. Left→right = X, top→bottom = Y. */
export const MAP_WIDTH = 1200;
export const MAP_HEIGHT = 800;

/** Transform building (pos_x, pos_z) to map (x, y). SVG y increases downward. */
export function buildingToMap(buildingX: number, buildingZ: number): { x: number; y: number } {
  const x = ((buildingX - BUILDING_BOUNDS.xMin) / (BUILDING_BOUNDS.xMax - BUILDING_BOUNDS.xMin)) * MAP_WIDTH;
  const y = MAP_HEIGHT - ((buildingZ - BUILDING_BOUNDS.zMin) / (BUILDING_BOUNDS.zMax - BUILDING_BOUNDS.zMin)) * MAP_HEIGHT;
  return { x, y };
}

/** Point-in-polygon (ray casting). Polygon in building (x,z) coords; point in building (x,z). */
export function pointInBuildingPolygon(px: number, pz: number, points: [number, number][]): boolean {
  let inside = false;
  const n = points.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, zi] = points[i];
    const [xj, zj] = points[j];
    if (((zi > pz) !== (zj > pz)) && (px < (xj - xi) * (pz - zi) / (zj - zi) + xi)) inside = !inside;
  }
  return inside;
}

/** Traffic density → fill color (airport dashboard style). */
export function densityToColor(count: number, maxInRoom: number): string {
  if (count === 0) return "rgba(34, 197, 94, 0.25)";   // green – low
  const t = maxInRoom <= 0 ? 0 : count / maxInRoom;
  if (t >= 0.7) return "rgba(239, 68, 68, 0.55)";      // red – high
  if (t >= 0.35) return "rgba(234, 179, 8, 0.45)";    // yellow – medium
  return "rgba(34, 197, 94, 0.4)";                     // green – low
}

export interface RoomPolygon {
  id: string;
  name: string;
  /** [x, z] pairs forming closed polygon (same coords as heatmap) */
  points: [number, number][];
}

export interface LiftZone {
  id: string;
  label: string;
  /** Center (x, z) and size in same units as heatmap */
  x: number;
  z: number;
  width: number;
  height: number;
}

/** Building perimeter (same as heatmapData) */
export const BLUEPRINT_OUTLINE: BuildingOutlinePoint[] = BUILDING_OUTLINE;

/** Core area where 4 lifts sit (center of floor) */
const CORE_X_MIN = 1.67;
const CORE_X_MAX = 5.56;
const CORE_Z_MIN = -0.69;
const CORE_Z_MAX = 4.48;
const CORE_W = CORE_X_MAX - CORE_X_MIN;
const CORE_H = CORE_Z_MAX - CORE_Z_MIN;

/** Four lifts in 2x2 grid in the middle */
export const LIFTS: LiftZone[] = [
  { id: "lift-1", label: "LIFT 1", x: CORE_X_MIN + CORE_W * 0.25, z: CORE_Z_MIN + CORE_H * 0.75, width: CORE_W * 0.48, height: CORE_H * 0.48 },
  { id: "lift-2", label: "LIFT 2", x: CORE_X_MIN + CORE_W * 0.75, z: CORE_Z_MIN + CORE_H * 0.75, width: CORE_W * 0.48, height: CORE_H * 0.48 },
  { id: "lift-3", label: "LIFT 3", x: CORE_X_MIN + CORE_W * 0.25, z: CORE_Z_MIN + CORE_H * 0.25, width: CORE_W * 0.48, height: CORE_H * 0.48 },
  { id: "lift-4", label: "LIFT 4", x: CORE_X_MIN + CORE_W * 0.75, z: CORE_Z_MIN + CORE_H * 0.25, width: CORE_W * 0.48, height: CORE_H * 0.48 },
];

/** Ground floor rooms as polygons - layout from PDF (left wing, core, right wing) */
export const GROUND_FLOOR_ROOMS: RoomPolygon[] = [
  // ---- Left wing (x -4.2 to -2.4) ----
  { id: "001", name: "SERVER ROOM", points: [[-4.19, -11], [-2.41, -11], [-2.41, -8.5], [-4.19, -8.5]] },
  { id: "023", name: "RECEPTION", points: [[-4.19, -8.5], [-2.41, -8.5], [-2.41, -6], [-4.19, -6]] },
  { id: "003", name: "BMS ROOM", points: [[-4.19, -6], [-2.41, -6], [-2.41, -4.5], [-4.19, -4.5]] },
  { id: "002", name: "IT STORE", points: [[-4.19, -4.5], [-2.41, -4.5], [-2.41, -2.5], [-4.19, -2.5]] },
  { id: "12", name: "TRAINING ROOM", points: [[-4.19, -2.5], [-2.41, -2.5], [-2.41, 0], [-4.19, 0]] },
  { id: "15", name: "STORE", points: [[-4.19, 0], [-2.41, 0], [-2.41, 1.5], [-4.19, 1.5]] },
  { id: "16", name: "STORE", points: [[-4.19, 1.5], [-2.41, 1.5], [-2.41, 3], [-4.19, 3]] },
  { id: "18", name: "LADIES TOILET", points: [[-4.19, 3], [-2.41, 3], [-2.41, 4.48], [-4.19, 4.48]] },
  { id: "19", name: "GENTS TOILET", points: [[-2.5, 4.48], [-2.5, 3], [-2.41, 3], [-2.41, 4.48]] },
  { id: "20", name: "GENTS TOILET", points: [[-2.5, 3], [-2.5, 1.5], [-2.41, 1.5], [-2.41, 3]] },
  { id: "21", name: "LADIES TOILET", points: [[-2.5, 1.5], [-2.5, 0], [-2.41, 0], [-2.41, 1.5]] },
  { id: "024", name: "RECRUITMENT & INFO", points: [[-2.5, 0], [-2.5, -2.5], [-2.41, -2.5], [-2.41, 0]] },
  { id: "290", name: "HR AREA", points: [[-2.5, -2.5], [-2.5, -4.5], [-2.41, -4.5], [-2.41, -2.5]] },
  { id: "291", name: "6 PAX MEETING", points: [[-2.5, -4.5], [-2.5, -6], [-2.41, -6], [-2.41, -4.5]] },
  { id: "294", name: "GENTS TOILET", points: [[-2.5, -6], [-2.5, -7.5], [-2.41, -7.5], [-2.41, -6]] },
  { id: "295", name: "LADIES TOILET", points: [[-2.5, -7.5], [-2.5, -9], [-2.41, -9], [-2.41, -7.5]] },
  { id: "297", name: "PANTRY", points: [[-2.5, -9], [-2.5, -10], [-2.41, -10], [-2.41, -9]] },
  { id: "300", name: "RECORDS ROOM (ADMIN)", points: [[-2.5, -10], [-2.5, -11], [-1.12, -11], [-1.12, -10], [-2.41, -10]] },
  { id: "369", name: "CABIN", points: [[-2.48, -0.69], [-2.48, -2], [-2.5, -2], [-2.5, -0.69]] },
  { id: "370", name: "PANTRY", points: [[-2.48, -2], [-2.48, -3.5], [-2.5, -3.5], [-2.5, -2]] },
  { id: "385", name: "ELECTRICAL ROOM", points: [[-2.48, -3.5], [-2.48, -4.75], [-2.5, -4.75], [-2.5, -3.5]] },
  { id: "394", name: "CABIN", points: [[-2.41, -4.75], [-1.12, -4.75], [-1.12, -6], [-2.41, -6]] },
  // ---- Core (around lifts - shafts, lobby, staircases) ----
  { id: "571", name: "RECORDS ROOM (FINANCE)", points: [[5.56, 4.48], [7, 4.48], [7, 3.5], [5.56, 3.5]] },
  { id: "572", name: "UPS", points: [[7, 4.48], [8, 4.48], [8, 3.5], [7, 3.5]] },
  { id: "573", name: "BATTERY ROOM", points: [[8, 4.48], [9.41, 4.48], [9.41, 3.5], [8, 3.5]] },
  { id: "592", name: "DB ROOM", points: [[1.67, -0.69], [1.67, 0.5], [3.1, 0.5], [3.1, -0.69]] },
  { id: "594", name: "LOBBY", points: [[3.1, -0.69], [3.1, 0.5], [5.56, 0.5], [5.56, -0.69]] },
  { id: "583", name: "STAIRCASE 4", points: [[5.56, 4.48], [5.56, 3], [7, 3], [7, 4.48]] },
  { id: "601", name: "STAIRCASE 3", points: [[5.56, 3], [5.56, 1.5], [7, 1.5], [7, 3]] },
  { id: "607", name: "STAIRCASE 1", points: [[1.67, 1.5], [1.67, 0.5], [3.1, 0.5], [3.1, 1.5]] },
  { id: "755", name: "STAIRCASE 2", points: [[9.41, 0], [9.41, -2], [9.33, -2], [9.33, 0]] },
  { id: "599", name: "CABIN", points: [[5.56, 0.5], [5.56, -0.69], [7, -0.69], [7, 0.5]] },
  { id: "585", name: "IT STAFF", points: [[7, 3.5], [7, 2], [9.41, 2], [9.41, 3.5]] },
  { id: "610", name: "HANDICAPED TOILET", points: [[1.67, -2], [1.67, -3.5], [3.1, -3.5], [3.1, -2]] },
  // ---- Right wing ----
  { id: "634", name: "LADIES TOILET", points: [[9.41, -6.4], [9.41, -5], [9.33, -5], [9.33, -6.4]] },
  { id: "743", name: "GENTS TOILET", points: [[9.41, -5], [9.41, -3.5], [9.33, -3.5], [9.33, -5]] },
  { id: "746", name: "DB ROOM", points: [[9.41, -3.5], [9.41, -2], [9.33, -2], [9.33, -3.5]] },
  { id: "748", name: "TRAINING ROOM", points: [[9.41, -0.7], [9.41, 0.5], [9.33, 0.5], [9.33, -0.7]] },
  { id: "749", name: "TRAINING ROOM", points: [[9.41, 0.5], [9.41, 1.8], [9.33, 1.8], [9.33, 0.5]] },
  { id: "750", name: "ADMIN & IT", points: [[9.41, 1.8], [9.41, 3], [9.33, 3], [9.33, 1.8]] },
  { id: "751", name: "INTERVIEW ROOM", points: [[7, 4.48], [7, 3.5], [8, 3.5], [8, 4.48]] },
  { id: "752", name: "INTERVIEW ROOM", points: [[8, 4.48], [8, 3.5], [9.41, 3.5], [9.41, 4.48]] },
  { id: "753", name: "INTERVIEW ROOM", points: [[9.41, 3], [9.41, 4.48], [9.33, 4.48], [9.33, 3]] },
  { id: "754", name: "RECORD ROOM", points: [[7, 3], [7, 1.5], [8, 1.5], [8, 3]] },
  { id: "757", name: "MEETING ROOM", points: [[8, 3], [8, 1.5], [9.41, 1.5], [9.41, 3]] },
  { id: "758", name: "MEETING ROOM", points: [[8, 1.5], [8, 0], [9.41, 0], [9.41, 1.5]] },
];

/** Convert (x,z) to SVG pixel coordinates; viewBox uses same scale for x/z */
export function blueprintToSvg(
  x: number,
  z: number,
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number },
  width: number,
  height: number
): { px: number; py: number } {
  const px = ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * width;
  const py = height - ((z - bounds.zMin) / (bounds.zMax - bounds.zMin)) * height;
  return { px, py };
}

export function polygonToSvgPath(
  points: [number, number][],
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number },
  width: number,
  height: number
): string {
  const pts = points.map(([x, z]) => blueprintToSvg(x, z, bounds, width, height));
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.px} ${p.py}`).join(" ") + " Z";
}

/** Polygon in building (x,z) → SVG path in map coordinates (viewBox 0 0 MAP_WIDTH MAP_HEIGHT). */
export function roomPolygonToMapPath(points: [number, number][]): string {
  const pts = points.map(([bx, bz]) => buildingToMap(bx, bz));
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
}

/** Lift in building coords → map rect (x, y, width, height) for SVG. */
export function liftToMapRect(lift: LiftZone): { x: number; y: number; width: number; height: number } {
  const topLeft = buildingToMap(lift.x - lift.width / 2, lift.z + lift.height / 2);
  const bottomRight = buildingToMap(lift.x + lift.width / 2, lift.z - lift.height / 2);
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: Math.max(4, bottomRight.x - topLeft.x),
    height: Math.max(4, bottomRight.y - topLeft.y),
  };
}

/** Building outline in map coords for SVG path. */
export function outlineToMapPath(): string {
  const pts = BLUEPRINT_OUTLINE.map((p) => buildingToMap(p.x, p.z));
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
}

/** Prefer SVG for full clarity when zooming (vector). Fallback to PNG. */
export const FLOOR_PLAN_GROUND_SVG = "/maps/mega-ground.svg";
export const FLOOR_PLAN_IMAGE_GROUND = "/maps/mega-ground.svg";
