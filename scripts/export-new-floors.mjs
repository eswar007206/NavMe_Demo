/**
 * Export new floor PDFs to PNGs:
 *   "1st floor.pdf"  → GroundFloor.png  (Ground Floor)
 *   "2nd floor.pdf"  → FirstFloor.png   (First Floor)
 *
 * Also generates HD variants used by the Heatmap page.
 *
 * Run: node scripts/export-new-floors.mjs
 */

import * as mupdf from "mupdf";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");

const FLOORS = [
  { pdf: "1st floor.pdf", out: "GroundFloor.png", outHD: "GroundFloor_HD.png", label: "Ground Floor" },
  { pdf: "2nd floor.pdf", out: "FirstFloor.png",  outHD: "FirstFloor_HD.png",  label: "First Floor" },
];

const TARGET_W = 1584;      // standard width (matches existing PNGs)
const TARGET_W_HD = 3168;   // HD variant (2× for heatmap)

for (const floor of FLOORS) {
  const pdfPath = path.join(publicDir, floor.pdf);
  if (!fs.existsSync(pdfPath)) {
    console.error(`Missing: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`\n── ${floor.label} ──`);
  console.log(`  PDF: ${floor.pdf}`);

  const pdfData = fs.readFileSync(pdfPath);
  const doc = mupdf.Document.openDocument(pdfData, "application/pdf");
  const page = doc.loadPage(0);

  const bbox = page.getBounds();
  const pageW = bbox[2] - bbox[0];
  const pageH = bbox[3] - bbox[1];
  console.log(`  Page size: ${pageW}×${pageH}`);

  // Standard resolution
  const scale = TARGET_W / pageW;
  const pixmap = page.toPixmap(
    mupdf.Matrix.scale(scale, scale),
    mupdf.ColorSpace.DeviceRGB,
    false,
    true
  );
  const outPath = path.join(publicDir, floor.out);
  fs.writeFileSync(outPath, pixmap.asPNG());
  console.log(`  → ${floor.out}  (${pixmap.getWidth()}×${pixmap.getHeight()})`);

  // HD resolution
  const scaleHD = TARGET_W_HD / pageW;
  const pixmapHD = page.toPixmap(
    mupdf.Matrix.scale(scaleHD, scaleHD),
    mupdf.ColorSpace.DeviceRGB,
    false,
    true
  );
  const outPathHD = path.join(publicDir, floor.outHD);
  fs.writeFileSync(outPathHD, pixmapHD.asPNG());
  console.log(`  → ${floor.outHD}  (${pixmapHD.getWidth()}×${pixmapHD.getHeight()})`);
}

console.log("\nDone! All floor PNGs exported.");
