/**
 * Export "level- 1F HVAC.pdf" to a compressed PNG for the first floor.
 * Run: node scripts/export-first-floor-png.cjs
 * Output: public/FirstFloor.png
 */

const path = require("path");
const fs = require("fs");
const { fromPath } = require("pdf2pic");

const projectRoot = path.resolve(__dirname, "..");
const pdfPath = path.join(projectRoot, "public", "level- 1F HVAC.pdf");
const outDir = path.join(projectRoot, "public");
const outName = "FirstFloor";

if (!fs.existsSync(pdfPath)) {
  console.error("Missing:", pdfPath);
  console.error("Place your first floor HVAC PDF there, then run this script.");
  process.exit(1);
}

async function run() {
  console.log("Converting PDF to PNG...");

  const converter = fromPath(pdfPath, {
    density: 300,
    saveFilename: outName,
    savePath: outDir,
    format: "png",
    width: 1584,
    height: 1224,
  });

  const result = await converter(1); // page 1
  console.log("Converted:", result.path || result.name);

  // pdf2pic appends ".1" to the filename — rename to clean name
  const generatedPath = path.join(outDir, `${outName}.1.png`);
  const finalPath = path.join(outDir, `${outName}.png`);

  if (fs.existsSync(generatedPath)) {
    fs.renameSync(generatedPath, finalPath);
    console.log("Done:", finalPath);
  } else if (fs.existsSync(finalPath)) {
    console.log("Done:", finalPath);
  } else {
    console.log("Output file:", result.path || result.name);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
