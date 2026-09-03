"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUserAction } from "../actions/auth";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  stores: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
}

export default function RegisterForm({ stores, warehouses }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<"STORE_MANAGER" | "WAREHOUSE_MANAGER">(
    "STORE_MANAGER",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeId, setStoreId] = useState(stores[0]?.id || "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await registerUserAction({
      name,
      email,
      password,
      role,
      storeId: role === "STORE_MANAGER" ? storeId : undefined,
      warehouseId: role === "WAREHOUSE_MANAGER" ? warehouseId : undefined,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
        <p className="font-bold text-sm">Kaydınız Başarıyla Alındı!</p>
        <p className="text-xs text-emerald-700">
          Hesabınız oluşturuldu. Yönetici onayının ardından giriş
          yapabilirsiniz. Giriş sayfasına aktarılıyorsunuz...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Ad Soyad
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ad Soyad"
          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          E-Posta Adresi
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ahmet@sirket.com"
          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Şifre
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Rol Seçimi
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
        >
          <option value="STORE_MANAGER">Mağaza Müdürü</option>
          <option value="WAREHOUSE_MANAGER">Depo Müdürü</option>
        </select>
      </div>

      {role === "STORE_MANAGER" && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Bağlı Mağaza
          </label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {role === "WAREHOUSE_MANAGER" && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Bağlı Depo
          </label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-3"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Kayıt yapılıyor...</span>
          </>
        ) : (
          "Kayıt Talebi Oluştur"
        )}
      </button>
    </form>
  );
}
