/**
 * Extract highlight regions from Ground Floor Plan.svg by element ID.
 * Run: node scripts/extract-svg-highlights.cjs
 *
 * For this to work, add IDs to your SVG in Inkscape (or any editor):
 * - Lifts: give a group or rect the id "lift-1", "lift-2", "lift-3", "lift-4"
 * - Cabins: id "cabin-1" … "cabin-8"
 * - Rooms: id "room-001", "room-023", "room-594" (LOBBY), etc. (use room id from GROUND_FLOOR_ROOMS)
 *
 * Prefer adding a single <rect> that covers the area (fill="none" stroke="none" is fine).
 * The script finds elements with these IDs and outputs bbox in 792×612 (viewBox) space
 * to public/floor-plan-highlights.json.
 */

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const svgPath = path.join(projectRoot, "public", "Ground Floor Plan.svg");
const outPath = path.join(projectRoot, "public", "floor-plan-highlights.json");

const EXPECTED_IDS = [
  "lift-1", "lift-2", "lift-3", "lift-4",
  "cabin-1", "cabin-2", "cabin-3", "cabin-4", "cabin-5", "cabin-6", "cabin-7", "cabin-8",
  "room-001", "room-023", "room-003", "room-002", "room-12", "room-15", "room-16",
  "room-18", "room-19", "room-20", "room-21", "room-024", "room-290", "room-291",
  "room-294", "room-295", "room-297", "room-300", "room-369", "room-370", "room-385",
  "room-394", "room-571", "room-572", "room-573", "room-592", "room-594", "room-583",
  "room-601", "room-607", "room-755", "room-599", "room-585", "room-610", "room-634",
  "room-743", "room-746", "room-748", "room-749", "room-750", "room-751", "room-752",
  "room-753", "room-754", "room-757", "room-758",
  "staircase-1", "staircase-2", "staircase-3", "staircase-4",
];

function parseMatrix(transformAttr) {
  if (!transformAttr || typeof transformAttr !== "string") return null;
  const m = transformAttr.match(/matrix\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
  if (!m) return null;
  return {
    a: parseFloat(m[1]), b: parseFloat(m[2]), c: parseFloat(m[3]),
    d: parseFloat(m[4]), e: parseFloat(m[5]), f: parseFloat(m[6]),
  };
}

function applyMatrix(m, x, y) {
  if (!m) return { x, y };
  return {
    x: m.a * x + m.c * y + m.e,
    y: m.b * x + m.d * y + m.f,
  };
}

function getRectBbox(rect, transformAttr) {
  const x = parseFloat(rect.x || rect["@_x"] || 0);
  const y = parseFloat(rect.y || rect["@_y"] || 0);
  const w = parseFloat(rect.width || rect["@_width"] || 0);
  const h = parseFloat(rect.height || rect["@_height"] || 0);
  const m = parseMatrix(transformAttr || rect["@_transform"] || rect.transform);
  const corners = [
    [x, y], [x + w, y], [x + w, y + h], [x, y + h],
  ];
  const transformed = corners.map(([cx, cy]) => applyMatrix(m, cx, cy));
  const xs = transformed.map((p) => p.x);
  const ys = transformed.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return [minX, minY, maxX - minX, maxY - minY];
}

function findIdInLine(line, ids) {
  for (const id of ids) {
    if (line.includes(`id="${id}"`) || line.includes(`id='${id}'`)) return id;
  }
  return null;
}

function parseRectFromLine(line) {
  const xM = line.match(/\sx=["']([^"']+)["']/);
  const yM = line.match(/\sy=["']([^"']+)["']/);
  const wM = line.match(/\swidth=["']([^"']+)["']/);
  const hM = line.match(/\sheight=["']([^"']+)["']/);
  const tM = line.match(/\stransform=["']([^"']+)["']/);
  if (!xM || !yM || !wM || !hM) return null;
  const x = parseFloat(xM[1]);
  const y = parseFloat(yM[1]);
  const w = parseFloat(wM[1]);
  const h = parseFloat(hM[1]);
  const transform = tM ? tM[1] : null;
  return getRectBbox({ x, y, width: w, height: h }, transform);
}

function main() {
  if (!fs.existsSync(svgPath)) {
    console.warn("SVG not found:", svgPath);
    fs.writeFileSync(outPath, JSON.stringify({}, null, 2));
    console.log("Wrote empty", outPath);
    return;
  }

  const content = fs.readFileSync(svgPath, "utf8");
  const highlights = {};
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const id = findIdInLine(line, EXPECTED_IDS);
    if (!id) continue;

    if (line.includes("<rect ") || line.trimStart().startsWith("<rect ")) {
      const bbox = parseRectFromLine(line);
      if (bbox) {
        highlights[id] = { bbox };
        console.log("Found", id, "-> bbox", bbox);
      }
    }
    // Support <g id="lift-1"><rect .../></g> on next line(s)
    if (line.includes("<g ") && line.includes("id=")) {
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].includes("<rect ")) {
          const bbox = parseRectFromLine(lines[j]);
          if (bbox) {
            highlights[id] = { bbox };
            console.log("Found", id, "(in <g>) -> bbox", bbox);
          }
          break;
        }
      }
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(highlights, null, 2));
  console.log("Wrote", Object.keys(highlights).length, "highlights to", outPath);
  if (Object.keys(highlights).length === 0) {
    console.log("\nNo elements with expected IDs found. Add to your SVG:");
    console.log("  - <rect id=\"lift-1\" x=\"...\" y=\"...\" width=\"...\" height=\"...\" />");
    console.log("  (and lift-2, cabin-1..8, room-001, room-023, room-594, etc.)");
  }
}

main();
