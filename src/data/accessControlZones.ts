/**
 * Access Control Zones — clickable areas on the ground floor plan (GroundFloor.png).
 *
 * The floor plan image is 792 x 612 pixels.
 * Each zone has a set of [x, y] corner points in IMAGE PIXEL coordinates.
 *   - (0, 0)   = top-left of the image
 *   - (792, 0)  = top-right
 *   - (0, 612)  = bottom-left
 *   - (792, 612) = bottom-right
 *
 * HOW TO ADD / EDIT ZONES:
 *   1. Open public/GroundFloor.png in any image editor (Paint, Figma, etc.)
 *   2. Identify the area you want to make a clickable zone
 *   3. Note the (x, y) pixel coordinates of each corner
 *   4. Add an entry below with those points
 *
 * For a simple rectangle you need 4 corner points:
 *   points: [
 *     [left, top],
 *     [right, top],
 *     [right, bottom],
 *     [left, bottom],
 *   ]
 */

export interface AccessZone {
  id: string;
  label: string;
  type: "lift" | "cabin" | "room" | "other";
  /** Corner points in image pixel coordinates [x, y] */
  points: [number, number][];
}

export const ACCESS_ZONES: AccessZone[] = [
  // ──────────── LIFTS ────────────
  // Adjust these x,y values to match the lift positions on your PNG
  {
    id: "lift-1",
    label: "LIFT 1",
    type: "lift",
    points: [
      [350, 380],
      [390, 380],
      [390, 420],
      [350, 420],
    ],
  },
  {
    id: "lift-2",
    label: "LIFT 2",
    type: "lift",
    points: [
      [350, 430],
      [390, 430],
      [390, 470],
      [350, 470],
    ],
  },
  {
    id: "lift-3",
    label: "LIFT 3",
    type: "lift",
    points: [
      [400, 380],
      [440, 380],
      [440, 420],
      [400, 420],
    ],
  },
  {
    id: "lift-4",
    label: "LIFT 4",
    type: "lift",
    points: [
      [400, 430],
      [440, 430],
      [440, 470],
      [400, 470],
    ],
  },

  // ──────────── CABINS ────────────
  // Example cabin — update points to match your image
  {
    id: "cabin-1",
    label: "Cabin 1",
    type: "cabin",
    points: [
      [480, 150],
      [560, 150],
      [560, 280],
      [480, 280],
    ],
  },
  {
    id: "cabin-2",
    label: "Cabin 2",
    type: "cabin",
    points: [
      [570, 150],
      [640, 150],
      [640, 280],
      [570, 280],
    ],
  },

  // ──────────── ROOMS ────────────
  // Example room — update points to match your image
  {
    id: "server-room",
    label: "Server Room",
    type: "room",
    points: [
      [50, 100],
      [150, 100],
      [150, 180],
      [50, 180],
    ],
  },
  {
    id: "reception",
    label: "Reception",
    type: "room",
    points: [
      [50, 190],
      [150, 190],
      [150, 270],
      [50, 270],
    ],
  },

  // ─── ADD MORE ZONES HERE ───
  // Copy-paste one of the entries above and change the id, label, type, and points.
  // Use your image editor to find the exact pixel coordinates.
];
