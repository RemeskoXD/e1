import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCzk } from '../lib/money';

type Product = {
  id: number;
  title: string;
  category: string;
  price: number;
  img: string;
  desc: string;
  validation_profile?: string | null;
  dimension_constraints?: {
    width_mm_min: number;
    width_mm_max: number;
    height_mm_min: number;
    height_mm_max: number;
    max_area_m2: number | null;
  } | null;
};

type QuoteRes = {
  total_czk: number;
  product_title?: string;
  vat_note?: string;
  catalog_warning?: string;
  catalog_note?: string;
  dimension_constraints?: Product['dimension_constraints'];
};

export default function ProductDetail({ productId }: { productId: string }) {
  const { addLine } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [widthMm, setWidthMm] = useState('');
  const [heightMm, setHeightMm] = useState('');
  const [fabric, setFabric] = useState('');
  const [lamela, setLamela] = useState('39');
  const [polyscreen, setPolyscreen] = useState(false);
  const [bezLatky, setBezLatky] = useState(false);
  const [ral, setRal] = useState(false);
  const [quote, setQuote] = useState<QuoteRes | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          setError('Nepodařilo se načíst produkt.');
          return;
        }
        const p = (data as Product[]).find((x) => String(x.id) === productId);
        if (!p) {
          setError('Produkt nenalezen.');
          return;
        }
        setProduct(p);
        const d = p.dimension_constraints;
        if (d) {
          setWidthMm(String(Math.round((d.width_mm_min + d.width_mm_max) / 2)));
          setHeightMm(String(Math.round((d.height_mm_min + d.height_mm_max) / 2)));
        }
      } catch {
        setError('Chyba sítě.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const buildOptions = (): Record<string, unknown> => {
    const o: Record<string, unknown> = {};
    const prof = product?.validation_profile;
    if (fabric.trim()) {
      o.fabric = fabric.trim();
      o.latka = fabric.trim();
    }
    if (prof === 'venkovni_roleta_radix') {
      o.lamela = lamela.trim() || '39';
    }
    if (prof === 'screen_roleta_union_l') {
      o.polyscreen = polyscreen;
      o.bez_latky = bezLatky;
      o.without_fabric = bezLatky;
      o.ral = ral;
      o.ral_dolni_profil = ral;
    }
    return o;
  };

  const runQuote = async () => {
    if (!product) return;
    const w = Number(widthMm);
    const h = Number(heightMm);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) {
      setQuoteError('Zadejte šířku a výšku v mm (kladná čísla).');
      setQuote(null);
      return;
    }
    setQuoting(true);
    setQuoteError(null);
    try {
      const body: Record<string, unknown> = {
        widthMm: w,
        heightMm: h,
        ...buildOptions(),
      };
      const res = await fetch(`/api/products/${product.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuote(null);
        setQuoteError(typeof data?.error === 'string' ? data.error : 'Výpočet ceny selhal.');
        return;
      }
      setQuote(data as QuoteRes);
    } catch {
      setQuote(null);
      setQuoteError('Nelze spojit se serverem.');
    } finally {
      setQuoting(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || !quote?.total_czk) return;
    const w = Math.round(Number(widthMm));
    const h = Math.round(Number(heightMm));
    addLine({
      productId: product.id,
      title: product.title,
      img: product.img,
      category: product.category,
      widthMm: w,
      heightMm: h,
      quantity: 1,
      unitPriceCzk: Math.round(quote.total_czk),
      options: buildOptions(),
    });
  };

  if (loading) {
    return (
      <div className="flex-grow container mx-auto px-6 py-24 text-center text-gray-500">
        Načítám produkt…
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-grow container mx-auto px-6 py-24">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">{error}</div>
        <a href="#/kategorie" className="inline-block mt-6 text-[#CCAD8A] font-bold">
          ← Zpět do katalogu
        </a>
      </div>
    );
  }

  const dim = product.dimension_constraints;
  const prof = product.validation_profile;

  return (
    <div className="flex-grow container mx-auto px-6 py-12">
      <a href="#/kategorie" className="text-sm text-[#CCAD8A] font-bold hover:underline mb-8 inline-block">
        ← Katalog
      </a>
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 aspect-[4/3]">
            <img src={product.img} alt={product.title} className="w-full h-full object-cover" />
          </div>
        </div>
        <div>
          <span className="text-[#CCAD8A] text-xs font-bold uppercase tracking-widest">
            {product.category}
          </span>
          <h1 className="text-3xl font-extrabold text-[#132333] mt-2 mb-4">{product.title}</h1>
          <p className="text-gray-600 mb-8 whitespace-pre-line">{product.desc}</p>

          {dim && (
            <p className="text-sm text-gray-500 mb-4">
              Povolené rozměry: {dim.width_mm_min}–{dim.width_mm_max} × {dim.height_mm_min}–
              {dim.height_mm_max} mm
              {dim.max_area_m2 != null ? ` · max. plocha ${dim.max_area_m2} m²` : ''}
            </p>
          )}

          <div className="space-y-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Šířka (mm)
                </label>
                <input
                  type="number"
                  min={1}
                  value={widthMm}
                  onChange={(e) => setWidthMm(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#CCAD8A] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Výška (mm)
                </label>
                <input
                  type="number"
                  min={1}
                  value={heightMm}
                  onChange={(e) => setHeightMm(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#CCAD8A] outline-none"
                />
              </div>
            </div>

            {(prof === 'textile_zaluzie' || prof === 'screen_roleta_union_l') && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Látka / popis (volitelné)
                </label>
                <input
                  type="text"
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#CCAD8A] outline-none"
                  placeholder="např. název látky"
                />
              </div>
            )}

            {prof === 'venkovni_roleta_radix' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Lamela
                </label>
                <input
                  type="text"
                  value={lamela}
                  onChange={(e) => setLamela(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#CCAD8A] outline-none"
                  placeholder="39 nebo 40"
                />
              </div>
            )}

            {prof === 'screen_roleta_union_l' && (
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={polyscreen}
                    onChange={(e) => setPolyscreen(e.target.checked)}
                  />
                  Polyscreen (+40 %)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bezLatky}
                    onChange={(e) => setBezLatky(e.target.checked)}
                  />
                  Bez látky (−25 %)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={ral} onChange={(e) => setRal(e.target.checked)} />
                  Spodní profil RAL (+10 %)
                </label>
              </div>
            )}

            <button
              type="button"
              onClick={runQuote}
              disabled={quoting}
              className="w-full bg-[#132333] text-white font-bold py-3 rounded-xl hover:bg-[#1a3145] transition-colors disabled:opacity-50"
            >
              {quoting ? 'Počítám…' : 'Přepočítat cenu'}
            </button>

            {quoteError && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{quoteError}</div>
            )}

            {quote && (
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-2xl font-black text-[#132333]">
                  {formatCzk(quote.total_czk)} Kč{' '}
                  <span className="text-sm font-normal text-gray-500">bez DPH</span>
                </p>
                {quote.vat_note && <p className="text-xs text-gray-500">{quote.vat_note}</p>}
                {quote.catalog_warning && (
                  <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-2 py-1">
                    {quote.catalog_warning}
                  </p>
                )}
                {quote.catalog_note && (
                  <p className="text-xs text-gray-600">{quote.catalog_note}</p>
                )}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full mt-2 bg-[#CCAD8A] text-[#132333] font-bold py-3 rounded-xl hover:bg-[#b5997a] transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Přidat do košíku
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
