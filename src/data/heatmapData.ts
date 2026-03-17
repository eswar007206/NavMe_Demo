export const FLOOR_Y_THRESHOLD = 3;
export const PROXIMITY_THRESHOLD = 2.0;

export const ROOM_COLORS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
  "#14B8A6", "#E11D48", "#9333EA",
];

export function getHeatColor(intensity: number): string {
  if (intensity >= 0.8) return "#EF4444";
  if (intensity >= 0.6) return "#F97316";
  if (intensity >= 0.4) return "#EAB308";
  if (intensity >= 0.2) return "#22D3EE";
  return "#3B82F6";
}

export function getHeatLabel(intensity: number): string {
  if (intensity >= 0.8) return "Peak";
  if (intensity >= 0.6) return "Very High";
  if (intensity >= 0.4) return "High";
  if (intensity >= 0.2) return "Moderate";
  return "Low";
}

export function distance2D(x1: number, z1: number, x2: number, z2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (z1 - z2) ** 2);
}

export function getFloor(posY: number): "ground" | "first" {
  return posY < FLOOR_Y_THRESHOLD ? "ground" : "first";
}

export interface BuildingOutlinePoint {
  label: string;
  x: number;
  z: number;
}

export const BUILDING_OUTLINE: BuildingOutlinePoint[] = [
  { label: "p1", x: 9.33, z: -11.0 },
  { label: "p2", x: 9.41, z: -6.4 },
  { label: "p3", x: 9.41, z: -0.7 },
  { label: "p4", x: 9.41, z: 4.52 },
  { label: "p5", x: 5.56, z: 4.48 },
  { label: "p6", x: 1.67, z: 4.48 },
  { label: "p7", x: -2.5, z: 4.48 },
  { label: "p8", x: -2.48, z: -0.69 },
  { label: "p9", x: -2.41, z: -4.75 },
  { label: "p10", x: -1.12, z: -11.0 },
  { label: "p11", x: -4.19, z: -11.0 },
];

export const BUILDING_BOUNDS = {
  zMin: -13,
  zMax: 6.5,
  xMin: -6,
  xMax: 11,
};

export function generateTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
}
