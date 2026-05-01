import { Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCzk } from '../lib/money';

export default function CartPage() {
  const { lines, subtotalCzk, updateQuantity, removeLine } = useCart();

  if (lines.length === 0) {
    return (
      <div className="flex-grow container mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#132333] mb-4">Košík je prázdný</h1>
        <a href="#/kategorie" className="text-[#CCAD8A] font-bold hover:underline">
          Prohlédnout katalog
        </a>
      </div>
    );
  }

  return (
    <div className="flex-grow container mx-auto px-6 py-12 max-w-3xl">
      <h1 className="text-3xl font-extrabold text-[#132333] mb-8">Košík</h1>
      <div className="space-y-4 mb-8">
        {lines.map((line) => (
          <div
            key={line.key}
            className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
          >
            <img
              src={line.img}
              alt=""
              className="w-24 h-24 object-cover rounded-lg bg-gray-50 shrink-0"
            />
            <div className="flex-grow min-w-0">
              <h2 className="font-bold text-[#132333] truncate">{line.title}</h2>
              <p className="text-sm text-gray-500">
                {line.widthMm} × {line.heightMm} mm · {formatCzk(line.unitPriceCzk)} Kč / ks bez DPH
              </p>
              <div className="flex items-center gap-3 mt-3">
                <label className="text-xs text-gray-500">Ks</label>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateQuantity(line.key, Number(e.target.value))}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                />
              </div>
            </div>
            <div className="text-right shrink-0 flex flex-col items-end gap-2">
              <p className="font-bold text-[#132333]">
                {formatCzk(line.unitPriceCzk * line.quantity)} Kč
              </p>
              <button
                type="button"
                onClick={() => removeLine(line.key)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                title="Odstranit"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-200 pt-6">
        <div>
          <p className="text-sm text-gray-500">Celkem bez DPH</p>
          <p className="text-2xl font-black text-[#132333]">{formatCzk(subtotalCzk)} Kč</p>
        </div>
        <a
          href="#/checkout"
          className="inline-flex justify-center bg-[#CCAD8A] text-[#132333] font-bold px-8 py-3 rounded-xl hover:bg-[#b5997a] transition-colors"
        >
          Pokračovat k objednávce
        </a>
      </div>
    </div>
  );
}
