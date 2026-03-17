/**
 * Export "level- 1F HVAC.pdf" to a compressed PNG for the first floor.
 * Run: node scripts/export-first-floor-png.mjs
 * Output: public/FirstFloor.png
 */

import * as mupdf from "mupdf";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const pdfPath = path.join(projectRoot, "public", "level- 1F HVAC.pdf");
const outPath = path.join(projectRoot, "public", "FirstFloor.png");

if (!fs.existsSync(pdfPath)) {
  console.error("Missing:", pdfPath);
  process.exit(1);
}

console.log("Reading PDF...");
const pdfData = fs.readFileSync(pdfPath);
const doc = mupdf.Document.openDocument(pdfData, "application/pdf");
const page = doc.loadPage(0);

// Scale to produce output ~1584px wide (matching ground floor at 2x)
const bbox = page.getBounds();
const pageW = bbox[2] - bbox[0];
const targetW = 1584;
const scale = targetW / pageW;

console.log(`Page size: ${pageW}x${bbox[3] - bbox[1]}, scale: ${scale.toFixed(2)}`);

const pixmap = page.toPixmap(
  mupdf.Matrix.scale(scale, scale),
  mupdf.ColorSpace.DeviceRGB,
  false, // no alpha
  true   // annots
);

const pngBuf = pixmap.asPNG();
fs.writeFileSync(outPath, pngBuf);
console.log("Done:", outPath);
console.log(`Output size: ${pixmap.getWidth()}x${pixmap.getHeight()}`);
