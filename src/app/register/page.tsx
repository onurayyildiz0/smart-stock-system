// src/app/register/page.tsx
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
    <div className="min-h-screen  flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-12 h-12  text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
          <UserPlus className="w-6 h-6" />
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Yeni Hesap Oluştur
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Akıllı Stok Dağıtım Sistemi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          <RegisterForm stores={stores} warehouses={warehouses} />

          <div className="mt-6 text-center text-xs text-slate-500">
            Zaten bir hesabın var mı?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
