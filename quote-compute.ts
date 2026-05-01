import type { Pool, PoolClient } from "pg";
import { computeRetailCzk } from "./pricing";
import { fabricToSkupina, validateTextileZaluzieDimensions } from "./textile-zaluzie-rules";
import {
  mapProductRow,
  num,
  optIntCol,
  optStrCol,
  readDimConstraints,
} from "./product-row";

export type QuoteComputeResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; body: Record<string, unknown> };

/**
 * Stejná logika jako POST /api/products/:id/quote — pro sdílené použití při vytváření objednávky.
 */
export async function computeProductQuote(
  db: Pool | PoolClient,
  productId: number,
  widthMm: number,
  heightMm: number,
  body: Record<string, unknown>
): Promise<QuoteComputeResult> {
  const id = productId;
  const pr = await db.query('SELECT * FROM "Product" WHERE id = $1', [id]);
  if (!pr.rows[0]) {
    return { ok: false, status: 404, body: { error: "Produkt nenalezen" } };
  }
  const rawRow = pr.rows[0] as Record<string, unknown>;
  const product = mapProductRow(rawRow);
  const dim = readDimConstraints(rawRow);
  const wR = Math.round(widthMm);
  const hR = Math.round(heightMm);
  const productTitle = String(rawRow.title ?? "");

  if (dim) {
    if (wR < dim.width_mm_min || wR > dim.width_mm_max) {
      return {
        ok: false,
        status: 400,
        body: { error: `Šířka musí být v rozmezí ${dim.width_mm_min}–${dim.width_mm_max} mm.` },
      };
    }
    if (hR < dim.height_mm_min || hR > dim.height_mm_max) {
      return {
        ok: false,
        status: 400,
        body: { error: `Výška musí být v rozmezí ${dim.height_mm_min}–${dim.height_mm_max} mm.` },
      };
    }
    const areaM2 = (wR * hR) / 1_000_000;
    if (dim.max_area_m2 != null && areaM2 - dim.max_area_m2 > 1e-6) {
      return {
        ok: false,
        status: 400,
        body: {
          error: `Plocha ${areaM2.toFixed(2)} m² překračuje maximum ${dim.max_area_m2} m².`,
        },
      };
    }
  }

  const valProfile = optStrCol(rawRow, "validation_profile");
  const fabricGroup = optIntCol(rawRow, "fabric_group");
  const fabricRaw = String(body?.fabric ?? body?.latka ?? "").trim();
  let screenUnionQuote: { poly: boolean; noFabric: boolean; ral: boolean } | null = null;
  const screenUnionCatalogNotes: string[] = [];

  if (valProfile === "screen_roleta_union_l") {
    const b = body;
    const fabricS = String(b?.fabric ?? b?.latka ?? "").toLowerCase();
    const poly =
      b?.polyscreen === true ||
      String(b?.polyscreen ?? "").toLowerCase() === "true" ||
      fabricS.includes("polyscreen");
    const noFabric =
      b?.bez_latky === true ||
      b?.without_fabric === true ||
      String(b?.bez_latky ?? "").toLowerCase() === "true" ||
      String(b?.without_fabric ?? "").toLowerCase() === "true" ||
      fabricS.includes("bez latky") ||
      fabricS.includes("bez látky");
    const ral =
      b?.ral_dolni_profil === true ||
      b?.ral === true ||
      String(b?.ral ?? "").toLowerCase() === "true" ||
      String(b?.ral_dolni_profil ?? "").toLowerCase() === "true";
    if (poly && noFabric) {
      return {
        ok: false,
        status: 400,
        body: {
          error: "Nelze kombinovat Polyscreen (+40 %) a provedení bez látky (−25 %).",
        },
      };
    }
    screenUnionQuote = { poly, noFabric, ral };
  }

  if (valProfile === "textile_zaluzie") {
    const vzErr = validateTextileZaluzieDimensions(wR, hR, fabricRaw || undefined);
    if (vzErr) {
      return { ok: false, status: 400, body: vzErr };
    }
    if (fabricRaw && fabricGroup != null) {
      const fSk = fabricToSkupina(fabricRaw);
      if (fSk != null && fSk !== fabricGroup) {
        return {
          ok: false,
          status: 400,
          body: {
            error: `Vybraná látka patří do skupiny ${fSk}, tento produkt je skupina látek ${fabricGroup}.`,
          },
        };
      }
    }
  }

  const priceMode = String(rawRow.price_mode ?? "matrix_cell").trim() || "matrix_cell";
  const supplier = product.supplier_markup_percent ?? 0;
  const commission = product.commission_percent ?? 0;

  if (priceMode === "m2_height_tiers") {
    const tierRes = await db.query(
      `SELECT * FROM "ProductHeightPriceTier"
       WHERE product_id = $1 AND $2::int >= height_mm_min AND $2::int <= height_mm_max
       ORDER BY sort_order ASC LIMIT 1`,
      [id, hR]
    );
    if (!tierRes.rows[0]) {
      return {
        ok: false,
        status: 400,
        body: { error: "Výška žaluzie nespadá do žádného pásma ceníku (zkontrolujte mm)." },
      };
    }
    const tier = tierRes.rows[0] as Record<string, unknown>;
    const pricePerM2 = num(tier, "price_per_m2_czk", "pricePerM2Czk");
    const areaM2 = (wR * hR) / 1_000_000;
    const baseCatalog = Math.round(areaM2 * pricePerM2);
    const total_czk = computeRetailCzk(baseCatalog, supplier, commission);
    return {
      ok: true,
      data: {
        product_id: id,
        product_title: productTitle,
        width_mm: wR,
        height_mm: hR,
        rounded_width_mm: wR,
        rounded_height_mm: hR,
        area_m2: Math.round(areaM2 * 1_000_000) / 1_000_000,
        price_per_m2_czk: pricePerM2,
        height_tier: {
          height_mm_min: num(tier, "height_mm_min", "heightMmMin"),
          height_mm_max: num(tier, "height_mm_max", "heightMmMax"),
        },
        base_catalog_czk: baseCatalog,
        supplier_markup_percent: supplier,
        commission_percent: commission,
        total_czk,
        source: "m2_height_tiers",
        pricing: "Kč/m² bez DPH podle výšky žaluzie × plocha (šířka × výška).",
        prices_ex_vat: true,
        vat_note: "Katalogové ceny jsou bez DPH (21 %).",
        dimension_constraints: dim,
      },
    };
  }

  const br = await db.query(
    `SELECT * FROM "ProductPriceBracket"
     WHERE product_id = $1 AND width_mm_max >= $2 AND height_mm_max >= $3
     ORDER BY width_mm_max ASC, height_mm_max ASC, base_price_czk ASC
     LIMIT 1`,
    [id, wR, hR]
  );
  let baseCatalogCzk =
    br.rows[0] != null
      ? num(br.rows[0] as Record<string, unknown>, "base_price_czk", "basePriceCzk")
      : num(product as Record<string, unknown>, "price");
  const matrixProfile = optStrCol(rawRow, "validation_profile");
  let radix_lamela_note: string | undefined;
  if (matrixProfile === "venkovni_roleta_radix") {
    const lamRaw = body?.lamela;
    const lamStr =
      lamRaw !== undefined && lamRaw !== null && String(lamRaw).trim() !== ""
        ? String(lamRaw).trim()
        : "39";
    const digitsOnly = lamStr.replace(/\D/g, "");
    const lamNum = digitsOnly ? parseInt(digitsOnly, 10) : 39;
    if (lamNum === 40) {
      baseCatalogCzk = Math.round(baseCatalogCzk * 1.05);
      radix_lamela_note = "Lamela 40: +5 % k tabulkové ceně (bez DPH), dle ceníku RADIX.";
    }
  }
  if (matrixProfile === "screen_roleta_union_l" && screenUnionQuote) {
    if (screenUnionQuote.noFabric) {
      baseCatalogCzk = Math.round(baseCatalogCzk * 0.75);
      screenUnionCatalogNotes.push("Bez látky: −25 % k základní tabulkové ceně.");
    }
    if (screenUnionQuote.poly) {
      baseCatalogCzk = Math.round(baseCatalogCzk * 1.4);
      screenUnionCatalogNotes.push("Polyscreen: +40 % k základní tabulkové ceně.");
    }
    if (screenUnionQuote.ral) {
      baseCatalogCzk = Math.round(baseCatalogCzk * 1.1);
      screenUnionCatalogNotes.push("Spodní profil v RAL: +10 %.");
    }
  }
  const total_czk = computeRetailCzk(baseCatalogCzk, supplier, commission);
  const bw = br.rows[0]
    ? num(br.rows[0] as Record<string, unknown>, "width_mm_max", "widthMmMax")
    : wR;
  const bh = br.rows[0]
    ? num(br.rows[0] as Record<string, unknown>, "height_mm_max", "heightMmMax")
    : hR;
  const catalog_warning =
    matrixProfile === "ext50_int50_matrix" && (wR >= 3100 || hR >= 3100)
      ? "Podle ceníku EXT 50 / INT 50 jde u tohoto rozměru o žaluzii bez garance (šířka nebo výška od 3 100 mm)."
      : undefined;

  const catalogNoteParts: string[] = [];
  if (radix_lamela_note) catalogNoteParts.push(radix_lamela_note);
  if (screenUnionCatalogNotes.length) catalogNoteParts.push(screenUnionCatalogNotes.join(" "));

  return {
    ok: true,
    data: {
      product_id: id,
      product_title: productTitle,
      width_mm: wR,
      height_mm: hR,
      rounded_width_mm: bw,
      rounded_height_mm: bh,
      base_catalog_czk: baseCatalogCzk,
      supplier_markup_percent: supplier,
      commission_percent: commission,
      total_czk,
      source: br.rows[0] ? "matrix" : "product_base_price",
      prices_ex_vat: true,
      vat_note: "Katalogové ceny jsou bez DPH (21 %).",
      dimension_constraints: dim,
      ...(catalog_warning ? { catalog_warning } : {}),
      ...(catalogNoteParts.length ? { catalog_note: catalogNoteParts.join(" ") } : {}),
    },
  };
}
