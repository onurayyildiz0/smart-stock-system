import { prisma } from "../lib/prisma";
import RegisterForm from "./RegisterForm";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const stores = await prisma.store.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const warehouses = await prisma.warehouse.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Yeni Hesap Oluştur
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Akıllı Stok Dağıtım Sistemi
          </p>
        </div>

        <RegisterForm stores={stores} warehouses={warehouses} />

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Zaten bir hesabınız var mı?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500 transition"
          >
            Giriş Yapın
          </Link>
        </div>
      </div>
    </div>
  );
}
