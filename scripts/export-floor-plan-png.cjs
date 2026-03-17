/**
 * Export Ground Floor Plan.svg to a compressed PNG so the app doesn't lag.
 * Run: node scripts/export-floor-plan-png.cjs
 * Output: public/GroundFloor.png (use this in the app instead of the 77MB SVG)
 */

const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");
const svgPath = path.join(projectRoot, "public", "Ground Floor Plan.svg");
const outPath = path.join(projectRoot, "public", "GroundFloor.png");

if (!fs.existsSync(svgPath)) {
  console.error("Missing:", svgPath);
  console.error("Place your ground floor SVG there, then run this script.");
  process.exit(1);
}

async function run() {
  const sharp = require("sharp");
  console.log("Reading SVG (this may take a moment for large files)...");
  await sharp(svgPath)
    .resize(1584, 1224)
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log("Done:", outPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
