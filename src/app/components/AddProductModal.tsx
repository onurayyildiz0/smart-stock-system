"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addProductAction } from "../actions/inventory";

// Depo listesini props olarak alıyoruz
export default function AddProductModal({
  warehouses,
}: {
  warehouses: { id: string; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await addProductAction(formData);
    setLoading(false);
    if (result.success) setIsOpen(false);
    else alert(result.error);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-sm font-semibold shadow-sm"
      >
        <Plus className="w-4 h-4" /> Yeni Ürün Tanımla
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Yeni Ürün Ekle
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ürün Adı
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    SKU (Barkod)
                  </label>
                  <input
                    type="text"
                    name="sku"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                    placeholder="PRD-001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  name="category"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                  placeholder="Elektronik, Giyim vb."
                />
              </div>

              <hr className="my-2" />
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Başlangıç Stoğu
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hangi Depoya Eklenecek?
                </label>
                <select
                  name="warehouseId"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Başlangıç Miktarı (Adet)
                </label>
                <input
                  type="number"
                  name="initialQty"
                  required
                  min="0"
                  defaultValue="0"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white rounded-lg p-2.5 font-semibold mt-2 hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Ekleniyor..." : "Ürünü Kaydet"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
