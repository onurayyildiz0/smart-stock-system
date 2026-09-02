"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addWarehouseAction } from "../actions/inventory";

export default function AddWarehouseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await addWarehouseAction(formData);
    setLoading(false);
    if (result.success) setIsOpen(false);
    else alert(result.error);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-semibold shadow-sm"
      >
        <Plus className="w-4 h-4" /> Yeni Depo Ekle
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Yeni Depo Tanımla
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Depo Adı
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                  placeholder="Örn: Merkez Depo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lokasyon
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                  placeholder="Örn: İstanbul, Avrupa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kapasite (Adet)
                </label>
                <input
                  type="number"
                  name="capacity"
                  required
                  min="1"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                  placeholder="Örn: 5000"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-lg p-2.5 font-semibold mt-2 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Ekleniyor..." : "Depoyu Kaydet"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
