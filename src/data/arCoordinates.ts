/**
 * NavMe AR navigation – exact XYZ coordinate system.
 * Used for ground floor map: traffic (user locations) and zones (lifts, cabins).
 * Format: x = horizontal, y = level/floor (~213–217 ground), z = depth (negative).
 */

/** AR coordinate bounds for ground floor (from your points). */
export const AR_BOUNDS = {
  xMin: 23,
  xMax: 55,
  yGround: 213, // ground floor y range ~213–217
  zMin: -81,
  zMax: -49,
};

/** [x, z] for 2D map (y ignored for top-down). */
export type ArPoint2D = [number, number];

/** [x, y, z] from AR. */
export type ArPoint3D = [number, number, number];

function to2d([x, , z]: ArPoint3D): ArPoint2D {
  return [x, z];
}

/** Lift 1 – 4 corners (exact AR XYZ → x,z). */
export const LIFT_1_AR: ArPoint2D[] = [
  [25.75305067375402, -74.60352302648829],
  [25.755203226232517, -76.4073967797155],
  [23.16524698428691, -76.42217918588752],
  [23.189590509051076, -74.50324280588607],
];

/** Lift 2 – 4 corners. */
export const LIFT_2_AR: ArPoint2D[] = [
  [25.83569592966986, -77.00411430871203],
  [25.810351811206452, -78.46972928372683],
  [23.41897095591227, -78.47802667476617],
  [23.41897095591227, -77.00594209593514],
];

/** Cabins 1–8 – polygon corners [x, z]. */
export const CABINS_AR: { id: string; name: string; points: ArPoint2D[] }[] = [
  {
    id: "cabin-1",
    name: "Cabin 1",
    points: [
      [33.85275663056126, -53.468889886123556],
      [33.85813584468092, -61.484638934908766],
      [35.75775503020504, -61.48201603711469],
      [39.109919705140626, -61.49277905454946],
      [39.05649241181761, -53.477435094548746],
    ],
  },
  {
    id: "cabin-2",
    name: "Cabin 2",
    points: [
      [39.96774618415516, -53.477435094548746],
      [39.825101282496185, -61.60479812326758],
      [42.71302148454008, -61.60373617375924],
      [42.890508148923374, -53.394515234639904],
    ],
  },
  {
    id: "cabin-3",
    name: "Cabin 3",
    points: [
      [43.55700767704252, -53.394515234639904],
      [43.52560050620687, -61.60373617375924],
      [46.13161990336717, -61.60373617375924],
      [46.46289343821812, -53.001604802165076],
    ],
  },
  {
    id: "cabin-4",
    name: "Cabin 4",
    points: [
      [47.16095111968081, -53.001604802165076],
      [46.98153755630779, -61.60373617375924],
      [52.12359106810155, -61.60373617375924],
      [52.24765799949135, -53.084026920763556],
    ],
  },
  {
    id: "cabin-5",
    name: "Cabin 5",
    points: [
      [33.51083421116128, -62.2646042778724],
      [33.34882554211653, -68.68018835506598],
      [39.147964017915584, -68.68018835506598],
      [39.082518324558436, -62.2646042778724],
    ],
  },
  {
    id: "cabin-6",
    name: "Cabin 6",
    points: [
      [39.78642152837392, -62.2646042778724],
      [39.9559633889504, -68.82363313087414],
      [42.52896787984255, -68.82363313087414],
      [42.533526026734464, -62.2646042778724],
    ],
  },
  {
    id: "cabin-7",
    name: "Cabin 7",
    points: [
      [43.727281212927295, -62.2646042778724],
      [43.40585773894938, -68.82363313087414],
      [46.132961838807276, -68.82363313087414],
      [46.169161039319356, -62.2646042778724],
    ],
  },
  {
    id: "cabin-8",
    name: "Cabin 8",
    points: [
      [46.61829666466861, -62.2646042778724],
      [46.9370698042616, -69.20816894393212],
      [52.11351247070864, -69.20816894393212],
      [52.029958436286186, -62.2646042778724],
    ],
  },
];

/** Lifts as polygons for click/hover (Lift 3 & 4 can be added when you have points). */
export const LIFTS_AR: { id: string; label: string; points: ArPoint2D[] }[] = [
  { id: "lift-1", label: "LIFT 1", points: LIFT_1_AR },
  { id: "lift-2", label: "LIFT 2", points: LIFT_2_AR },
  // Placeholder for Lift 3 & 4 – same area as 1 & 2 if not yet surveyed
  { id: "lift-3", label: "LIFT 3", points: LIFT_1_AR },
  { id: "lift-4", label: "LIFT 4", points: LIFT_2_AR },
];

/** Sample traffic points (your shared points) – for reference / demo. */
export const SAMPLE_TRAFFIC_AR: ArPoint2D[] = [
  [54.3773442863818, -49.86285257122222],
  [54.18615016638701, -71.88806601149669],
  [39.31307203748913, -71.94840266839853],
  [39.17853515821644, -80.07557326691207],
  [23.701134462895716, -80.41736149474863],
  [23.700661213660226, -72.73789385382781],
  [50.63003106685248, -52.01829622285916],
];

/** Check if (x, z) is inside polygon (ray casting). */
export function pointInArPolygon(px: number, pz: number, points: ArPoint2D[]): boolean {
  let inside = false;
  const n = points.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, zi] = points[i];
    const [xj, zj] = points[j];
    if (((zi > pz) !== (zj > pz)) && (px < (xj - xi) * (pz - zi) / (zj - zi) + xi)) inside = !inside;
  }
  return inside;
}

/** SVG viewBox string for AR ground floor (x, z). */
export function arViewBox(): string {
  const { xMin, xMax, zMin, zMax } = AR_BOUNDS;
  const w = xMax - xMin;
  const h = zMax - zMin;
  return `${xMin} ${zMin} ${w} ${h}`;
}

/** Polygon to SVG path in AR space (x, z). */
export function arPolygonToPath(points: ArPoint2D[]): string {
  const pts = points.map(([x, z]) => `${x},${z}`);
  return `M ${pts.join(" L ")} Z`;
}
