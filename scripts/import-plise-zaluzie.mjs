/**
 * Import produktu „Žaluzie plisé“ + ceníková mřížka (Kč bez DPH) z tabulky v obrázku.
 * npm run import:cenik:plise
 */
import "dotenv/config";
import { Pool } from "pg";
import { pliseBracketsFromGrid } from "./plise-cenik-data.mjs";

const PRODUCT_TITLE = "Žaluzie plisé";
const PRODUCT_CATEGORY = "Interiérové stínění";
const IMG_DEFAULT =
  "https://web2.itnahodinu.cz/qapieshop/Obrázky/Interiérové%20stínění/Plisé%20žaluzie/menu-plise.jpg";

async function ensureProductColumns(client) {
  for (const sql of [
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS supplier_markup_percent NUMERIC(6,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(6,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS width_mm_min INTEGER`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS width_mm_max INTEGER`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS height_mm_min INTEGER`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS height_mm_max INTEGER`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS max_area_m2 NUMERIC(6,2)`,
  ]) {
    await client.query(sql).catch(() => {});
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Chybí DATABASE_URL");
    process.exit(1);
  }

  const brackets = pliseBracketsFromGrid();
  const minPrice = Math.min(...brackets.map((b) => b.base_price_czk));

  const desc =
    "Plisé žaluzie — ceny dle tabulkového ceníku v Kč bez DPH (21 %). Rozměry zaokrouhlit nahoru na nejbližší tabulkový krok 100 mm. " +
    "V dokumentu není vypsané výslovné minimum — jako nejmenší tabulkový bod používáme 400 × 800 mm (1090 Kč bez DPH). " +
    "Rozsah tabulky: šířka 400–2200 mm, výška 800–3000 mm. Omezení plochy v ceníku nemáte — v databázi není nastavený limit m².";

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: /sslmode=require/i.test(process.env.DATABASE_URL)
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Product" (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        price INTEGER,
        "oldPrice" INTEGER,
        badge VARCHAR(50),
        img TEXT,
        "desc" TEXT
      );
    `);
    await ensureProductColumns(client);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ProductPriceBracket" (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
        width_mm_max INTEGER NOT NULL,
        height_mm_max INTEGER NOT NULL,
        base_price_czk INTEGER NOT NULL,
        sort_order INTEGER DEFAULT 0
      );
    `);

    const existing = await client.query(`SELECT id FROM "Product" WHERE title = $1`, [PRODUCT_TITLE]);
    let productId;

    if (existing.rows[0]) {
      productId = existing.rows[0].id;
      await client.query(`DELETE FROM "ProductPriceBracket" WHERE product_id = $1`, [productId]);
      await client.query(
        `UPDATE "Product" SET category=$2, price=$3, img=$4, "desc"=$5,
          supplier_markup_percent = 4.9, badge = $6,
          width_mm_min=$7, width_mm_max=$8, height_mm_min=$9, height_mm_max=$10, max_area_m2 = NULL
         WHERE id = $1`,
        [
          productId,
          PRODUCT_CATEGORY,
          minPrice,
          IMG_DEFAULT,
          desc,
          "Na míru",
          400,
          2200,
          800,
          3000,
        ]
      );
      console.log("Aktualizuji produkt id=", productId);
    } else {
      const ins = await client.query(
        `INSERT INTO "Product" (title, category, price, "oldPrice", badge, img, "desc", supplier_markup_percent, commission_percent,
          width_mm_min, width_mm_max, height_mm_min, height_mm_max, max_area_m2)
         VALUES ($1, $2, $3, NULL, $4, $5, $6, 4.9, 0, $7, $8, $9, $10, NULL) RETURNING id`,
        [
          PRODUCT_TITLE,
          PRODUCT_CATEGORY,
          minPrice,
          "Na míru",
          IMG_DEFAULT,
          desc,
          400,
          2200,
          800,
          3000,
        ]
      );
      productId = ins.rows[0].id;
      console.log("Vytvořen produkt id=", productId);
    }

    for (const b of brackets) {
      await client.query(
        `INSERT INTO "ProductPriceBracket" (product_id, width_mm_max, height_mm_max, base_price_czk, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [productId, b.width_mm_max, b.height_mm_max, b.base_price_czk, b.sort_order]
      );
    }
    console.log("Hotovo:", brackets.length, "řádků ceníku plisé.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
