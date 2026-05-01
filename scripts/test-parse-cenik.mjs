import fs from "fs";
import { PDFParse } from "pdf-parse";
import { parseFirstIsolineMatrix } from "./parse-isoline-matrix.mjs";

const p = process.argv[2] || "C:/Users/ludvi/Desktop/Qapieshop/Katalogy/01_CENIK_horizontalni_zaluzie.pdf";
const buf = fs.readFileSync(p);
const parser = new PDFParse({ data: buf });
const tr = await parser.getText();
await parser.destroy();
const r = parseFirstIsolineMatrix(tr.text);
console.log("brackets", r.brackets.length, "min", r.minPrice);
const s = r.brackets.find((b) => b.width_mm_max === 800 && b.height_mm_max === 600);
console.log("800×600 →", s);
