// src/app/register/RegisterForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUserAction } from "../actions/auth";
import { Loader2 } from "lucide-react";

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
      }, 2500);
    }
  };

  if (success) {
    return (
      <div className="p-4  border border-emerald-200 text-emerald-800 rounded-xl text-center space-y-2">
        <p className="font-bold text-sm">Kaydınız Başarıyla Alındı!</p>
        <p className="text-xs text-emerald-700">
          Hesabınız oluşturuldu. Yönetici onayının ardından giriş
          yapabilirsiniz. Giriş sayfasına yönlendiriliyorsunuz...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left ">
      {error && (
        <div className="p-3  border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs  font-semibold text-slate-700 mb-1">
          Ad Soyad
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ahmet Yılmaz"
          className="w-full px-3 py-2 border text-black border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          E-Posta
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ahmet@sirket.com"
          className="w-full px-3 py-2 border text-black border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
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
          className="w-full px-3 py-2 border text-black border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Rol
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-full px-3 py-2 border text-black border-slate-200 rounded-xl text-sm  outline-none focus:border-indigo-600"
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
            className="w-full px-3 py-2 border text-black border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-600"
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
            className="w-full px-3 py-2 border text-black border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-600"
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
        className="w-full flex items-center justify-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50 mt-4"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Kayıt Talebi Oluştur"
        )}
      </button>
    </form>
  );
}
