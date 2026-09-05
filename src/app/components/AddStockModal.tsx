// src/app/components/AddStockModal.tsx
"use client";

import { useState } from "react";
import { addStockToWarehouseAction } from "../actions/inventory";
import { Plus, X, Loader2 } from "lucide-react";

interface Props {
  warehouseId: string;
  warehouseName: string;
}

export default function AddStockModal({ warehouseId, warehouseName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Genel");
  const [price, setPrice] = useState<string>(""); // Başlangıçta boş bırakıldı
  const [quantity, setQuantity] = useState<string>("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Lütfen 0'dan büyük geçerli bir birim maliyet girin.");
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError("Lütfen geçerli bir miktar girin.");
      return;
    }

    setLoading(true);

    const res = await addStockToWarehouseAction({
      warehouseId,
      productName,
      category,
      price: parsedPrice,
      quantity: parsedQuantity,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setProductName("");
      setCategory("Genel");
      setPrice("");
      setQuantity("10");
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        Yeni Ürün / Stok Ekle
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Depoya Stok Ekle
                </h3>
                <p className="text-xs text-slate-500">{warehouseName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ürün Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Örn: Laptop, Monitör..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Örn: Donanım, Sarf Malzeme..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Birim Maliyet (TL) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Örn: 2500"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Miktar (Adet) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Stoku Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
