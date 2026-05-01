import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Search, Edit2, Trash2, Terminal, ChevronDown, ChevronRight, X, ExternalLink } from 'lucide-react';
import { computeDisplayPriceCzk, formatCzk, toMoneyNumber } from '../../lib/money';
import { CENIK_IMPORT_COMMANDS } from '../../lib/cenikImportCommands';

interface DimConstraints {
  width_mm_min: number;
  width_mm_max: number;
  height_mm_min: number;
  height_mm_max: number;
  max_area_m2: number | null;
}

interface Product {
  id: number | string;
  title: string;
  category: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  img: string;
  desc: string;
  supplier_markup_percent?: number;
  commission_percent?: number;
  display_price?: number;
  dimension_constraints?: DimConstraints | null;
  width_mm_min?: number | null;
  width_mm_max?: number | null;
  height_mm_min?: number | null;
  height_mm_max?: number | null;
  max_area_m2?: number | null;
  price_mode?: string | null;
  fabric_group?: number | null;
  validation_profile?: string | null;
}

/** Formulář v modalu — prázdné numerické pole jako '' před odesláním na API. */
type AdminProductForm = Partial<Omit<Product, 'width_mm_min' | 'width_mm_max' | 'height_mm_min' | 'height_mm_max' | 'max_area_m2' | 'fabric_group'>> & {
  width_mm_min?: number | '' | null;
  width_mm_max?: number | '' | null;
  height_mm_min?: number | '' | null;
  height_mm_max?: number | '' | null;
  max_area_m2?: number | '' | null;
  fabric_group?: number | string | '' | null;
};

function formatDimsMm(p: Product): string {
  const d = p.dimension_constraints;
  if (d) {
    return `${d.width_mm_min}–${d.width_mm_max} × ${d.height_mm_min}–${d.height_mm_max} mm`;
  }
  if (
    p.width_mm_min != null &&
    p.width_mm_max != null &&
    p.height_mm_min != null &&
    p.height_mm_max != null
  ) {
    return `${p.width_mm_min}–${p.width_mm_max} × ${p.height_mm_min}–${p.height_mm_max} mm`;
  }
  return '—';
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importHelpOpen, setImportHelpOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<AdminProductForm>({
    title: '',
    category: '',
    price: 0,
    oldPrice: undefined,
    badge: '',
    img: '',
    desc: '',
    supplier_markup_percent: 0,
    commission_percent: 0,
    width_mm_min: '',
    width_mm_max: '',
    height_mm_min: '',
    height_mm_max: '',
    max_area_m2: '',
    price_mode: '',
    fabric_group: '',
    validation_profile: '',
  });

  const fetchProducts = async () => {
    setFetchError(null);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (!res.ok) {
        setProducts([]);
        setFetchError(typeof data?.error === 'string' ? data.error : 'Nepodařilo se načíst produkty.');
        return;
      }
      if (Array.isArray(data)) {
        setProducts(data as Product[]);
      } else {
        setProducts([]);
        setFetchError('Odpověď serveru není seznam produktů.');
      }
    } catch {
      setProducts([]);
      setFetchError('Nelze se spojit se serverem (zkontrolujte, že běží aplikace a DATABASE_URL).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const customerPrice = (p: Product) =>
    p.display_price != null && Number.isFinite(p.display_price)
      ? p.display_price
      : computeDisplayPriceCzk(
          p.price,
          p.supplier_markup_percent ?? 0,
          p.commission_percent ?? 0
        );

  const dimToForm = (product: Product) => {
    const d = product.dimension_constraints;
    if (d) {
      return {
        width_mm_min: d.width_mm_min,
        width_mm_max: d.width_mm_max,
        height_mm_min: d.height_mm_min,
        height_mm_max: d.height_mm_max,
        max_area_m2:
          d.max_area_m2 != null && Number.isFinite(d.max_area_m2) ? d.max_area_m2 : ('' as const),
      };
    }
    if (product.width_mm_min != null && product.width_mm_max != null) {
      return {
        width_mm_min: toMoneyNumber(product.width_mm_min),
        width_mm_max: toMoneyNumber(product.width_mm_max),
        height_mm_min: toMoneyNumber(product.height_mm_min),
        height_mm_max: toMoneyNumber(product.height_mm_max),
        max_area_m2:
          product.max_area_m2 != null && Number.isFinite(Number(product.max_area_m2))
            ? toMoneyNumber(product.max_area_m2)
            : ('' as const),
      };
    }
    return {
      width_mm_min: '' as const,
      width_mm_max: '' as const,
      height_mm_min: '' as const,
      height_mm_max: '' as const,
      max_area_m2: '' as const,
    };
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      const dim = dimToForm(product);
      setFormData({
        title: product.title,
        category: product.category,
        price: toMoneyNumber(product.price),
        oldPrice: product.oldPrice != null ? toMoneyNumber(product.oldPrice) : undefined,
        badge: product.badge,
        img: product.img,
        desc: product.desc,
        supplier_markup_percent: toMoneyNumber(product.supplier_markup_percent),
        commission_percent: toMoneyNumber(product.commission_percent),
        ...dim,
        price_mode: product.price_mode ?? '',
        fabric_group: product.fabric_group != null ? String(product.fabric_group) : '',
        validation_profile: product.validation_profile ?? '',
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        category: '',
        price: 0,
        oldPrice: undefined,
        badge: '',
        img: '',
        desc: '',
        supplier_markup_percent: 4.9,
        commission_percent: 0,
        width_mm_min: '',
        width_mm_max: '',
        height_mm_min: '',
        height_mm_max: '',
        max_area_m2: '',
        price_mode: '',
        fabric_group: '',
        validation_profile: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    if (!token) return alert('No admin token');

    try {
      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          supplier_markup_percent: toMoneyNumber(formData.supplier_markup_percent),
          commission_percent: toMoneyNumber(formData.commission_percent),
          width_mm_min: formData.width_mm_min === '' ? null : formData.width_mm_min,
          width_mm_max: formData.width_mm_max === '' ? null : formData.width_mm_max,
          height_mm_min: formData.height_mm_min === '' ? null : formData.height_mm_min,
          height_mm_max: formData.height_mm_max === '' ? null : formData.height_mm_max,
          max_area_m2: formData.max_area_m2 === '' ? null : formData.max_area_m2,
          price_mode:
            formData.price_mode === '' || formData.price_mode == null
              ? 'matrix_cell'
              : formData.price_mode,
          fabric_group:
            formData.fabric_group === '' || formData.fabric_group == null
              ? null
              : Number(formData.fabric_group),
          validation_profile:
            formData.validation_profile === '' || formData.validation_profile == null
              ? null
              : formData.validation_profile,
        }),
      });

      if (res.ok) {
        handleCloseModal();
        fetchProducts();
      } else {
        let msg = 'Chyba při ukládání produktu';
        try {
          const errBody = await res.json();
          if (typeof errBody?.error === 'string') msg = errBody.error;
        } catch {
          /* ignore */
        }
        alert(msg);
      }
    } catch {
      alert('Chyba serveru');
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Opravdu smazat tento produkt?')) return;
    const token = localStorage.getItem('adminToken');
    if (!token) return alert('No admin token');

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchProducts();
      } else {
        alert('Chyba při mazání');
      }
    } catch {
      alert('Chyba serveru');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Načítám produkty...</div>;
  }

  const q = searchQuery.trim().toLowerCase();
  const filteredProducts = q
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.price_mode && String(p.price_mode).toLowerCase().includes(q)) ||
          (p.validation_profile && p.validation_profile.toLowerCase().includes(q))
      )
    : products;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#132333]">Produkty a Ceníky</h1>
          <p className="text-gray-500 mt-1">
            Data výhradně z databáze. Limity rozměrů a kalkulačka API používají{' '}
            <span className="font-semibold text-[#132333]">milimetry (mm)</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setImportHelpOpen((o) => !o)}
            className="bg-white border border-gray-200 text-[#132333] hover:bg-gray-50 font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <Terminal size={18} />
            Import ceníků (npm)
            {importHelpOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="bg-[#CCAD8A] hover:bg-[#b5997a] text-[#132333] font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Nový produkt
          </button>
        </div>
      </div>

      {importHelpOpen && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-3">
            Spusťte v kořeni projektu (s proměnnou <code className="text-xs bg-gray-100 px-1 rounded">DATABASE_URL</code> v{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">.env</code>). Po importu obnovte tuto stránku.
          </p>
          <ul className="space-y-2 text-sm font-mono text-[#132333]">
            {CENIK_IMPORT_COMMANDS.map((row) => (
              <li key={row.command} className="flex flex-col sm:flex-row sm:items-baseline gap-1 border-b border-gray-50 pb-2 last:border-0">
                <span className="shrink-0 font-semibold">{row.command}</span>
                <span className="text-gray-500 sm:ml-2 font-sans text-xs sm:text-sm">— {row.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {fetchError}
        </div>
      )}

      {!fetchError && products.length === 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          V databázi zatím nejsou žádné produkty. Použijte výše uvedené příkazy{' '}
          <span className="font-semibold">npm run import:…</span> nebo přidejte produkt ručně.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Vyhledat produkt…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCAD8A] focus:bg-white transition-all"
            />
          </div>
          <div className="text-sm font-semibold text-gray-500">
            Zobrazeno: {filteredProducts.length}
            {q ? ` / ${products.length}` : ''} produktů
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="py-4 px-6 font-semibold">Produkt</th>
                <th className="py-4 px-6 font-semibold">Kategorie</th>
                <th className="py-4 px-6 font-semibold">Rozměry (mm)</th>
                <th className="py-4 px-6 font-semibold">Základ (ceník)</th>
                <th className="py-4 px-6 font-semibold">Navýšení %</th>
                <th className="py-4 px-6 font-semibold">Provize %</th>
                <th className="py-4 px-6 font-semibold">Cena pro zákazníka</th>
                <th className="py-4 px-6 font-semibold text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[#132333] font-medium text-sm">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={prod.img}
                        alt={prod.title}
                        className="w-12 h-12 rounded object-cover border border-gray-200 shrink-0"
                      />
                      <div>
                        <span className="font-bold block">{prod.title}</span>
                        {prod.price_mode && (
                          <span className="text-xs text-gray-400 font-normal">{prod.price_mode}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-500">{prod.category}</td>
                  <td className="py-4 px-6 text-xs text-gray-600 whitespace-nowrap">{formatDimsMm(prod)}</td>
                  <td className="py-4 px-6">{formatCzk(prod.price)} Kč</td>
                  <td className="py-4 px-6">{toMoneyNumber(prod.supplier_markup_percent)} %</td>
                  <td className="py-4 px-6">{toMoneyNumber(prod.commission_percent)} %</td>
                  <td className="py-4 px-6 font-bold text-[#132333]">{formatCzk(customerPrice(prod))} Kč</td>
                  <td className="py-4 px-6 text-right whitespace-nowrap space-x-1">
                    <a
                      href={`#/produkt/${prod.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Náhled na e-shopu"
                      className="inline-flex p-2 text-gray-400 hover:text-[#132333] transition-colors rounded-lg hover:bg-gray-100"
                    >
                      <ExternalLink size={18} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenModal(prod)}
                      className="p-2 text-gray-400 hover:text-[#CCAD8A] transition-colors rounded-lg hover:bg-[#CCAD8A]/10"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(prod.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#132333]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-[#132333]">
                {editingId ? 'Upravit produkt' : 'Nový produkt'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-[#132333] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Název produktu</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCAD8A] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kategorie</label>
                  <input
                    required
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="např. Žaluzie, Rolety"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCAD8A] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cena ze ceníku / základ (Kč)</label>
                  <input
                    required
                    type="number"
                    step="1"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCAD8A] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Původní cena základ (Kč) – volitelné</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.oldPrice ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        oldPrice: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCAD8A] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Navýšení dodavatele (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.supplier_markup_percent ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplier_markup_percent: Number(e.target.value),
                      })
                    }
                    placeholder="např. 4,9 u horizontálních žaluzií"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCAD8A] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Provize (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commission_percent ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commission_percent: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCAD8A] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Štítek (např. Akce, Bestseller)</label>
                  <input
                    type="text"
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCAD8A] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">URL obrázku</label>
                  <input
                    required
                    type="text"
                    value={formData.img}
                    onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCAD8A] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Popis produktu</label>
                <textarea
                  required
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCAD8A] transition-all h-32"
                />
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/80">
                <p className="text-sm font-bold text-[#132333] mb-3">Limity rozměrů (volitelné, pro kalkulačku API)</p>
                <p className="text-xs text-gray-500 mb-4">
                  Všechny hodnoty níže jsou v <span className="font-semibold text-[#132333]">milimetrech (mm)</span>.
                  Vyplňte šířku/výšku min–max najednou, nebo sekci vyprázdněte. Max. plocha je volitelná — prázdné =
                  kontrola plochy v kalkulačce se nepoužije.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Šířka min (mm)</label>
                    <input
                      type="number"
                      value={formData.width_mm_min === '' || formData.width_mm_min == null ? '' : formData.width_mm_min}
                      onChange={(e) =>
                        setFormData({ ...formData, width_mm_min: e.target.value === '' ? '' : Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Šířka max (mm)</label>
                    <input
                      type="number"
                      value={formData.width_mm_max === '' || formData.width_mm_max == null ? '' : formData.width_mm_max}
                      onChange={(e) =>
                        setFormData({ ...formData, width_mm_max: e.target.value === '' ? '' : Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Výška min (mm)</label>
                    <input
                      type="number"
                      value={formData.height_mm_min === '' || formData.height_mm_min == null ? '' : formData.height_mm_min}
                      onChange={(e) =>
                        setFormData({ ...formData, height_mm_min: e.target.value === '' ? '' : Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Výška max (mm)</label>
                    <input
                      type="number"
                      value={formData.height_mm_max === '' || formData.height_mm_max == null ? '' : formData.height_mm_max}
                      onChange={(e) =>
                        setFormData({ ...formData, height_mm_max: e.target.value === '' ? '' : Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Max. plocha (m²) — volitelné</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_area_m2 === '' || formData.max_area_m2 == null ? '' : formData.max_area_m2}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_area_m2: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Režim ceny (price_mode)
                    </label>
                    <input
                      type="text"
                      value={formData.price_mode === '' || formData.price_mode == null ? '' : String(formData.price_mode)}
                      onChange={(e) =>
                        setFormData({ ...formData, price_mode: e.target.value })
                      }
                      placeholder="matrix_cell"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Skupina látek (1–5)
                    </label>
                    <input
                      type="number"
                      value={
                        formData.fabric_group === '' || formData.fabric_group == null
                          ? ''
                          : formData.fabric_group
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fabric_group: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Validace (např. textile_zaluzie)
                    </label>
                    <input
                      type="text"
                      value={
                        formData.validation_profile === '' || formData.validation_profile == null
                          ? ''
                          : formData.validation_profile
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, validation_profile: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Zobrazená cena zákazníkovi: základ × (1 + navýšení/100) × (1 + provize/100), zaokrouhleno na celé Kč.
                Katalogové částky jsou bez DPH, pokud to tak máte v popisu uvedené.
              </p>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-[#132333] hover:bg-[#1a3047] text-white transition-colors"
                >
                  Uložit produkt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
