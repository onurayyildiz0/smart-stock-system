// src/app/page.tsx
import React from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { prisma } from "./lib/prisma";
import RunButton from "./components/RunButton";
import AddDemandModal from "./components/AddDemandModal";
import StorePriorityForm from "./components/StorePriorityForm";
import {
  Building2,
  Warehouse,
  TrendingUp,
  CheckCircle2,
  Truck,
  Layers,
  AlertTriangle,
} from "lucide-react";
import DeleteDemandButton from "./components/DeleteDemandButton";
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";
import UserApprovalButtons from "./components/UserApprovalButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const role = user?.role || "USER";
  const userStoreId = user?.storeId;
  const userWarehouseId = user?.warehouseId;

  // 1. Depolar ve Stoklar (Depo Müdürü ise sadece kendi deposu, Admin hepsi)
  const warehouses = await prisma.warehouse.findMany({
    where:
      role === "WAREHOUSE_MANAGER" && userWarehouseId
        ? { id: userWarehouseId }
        : undefined,
    include: {
      stocks: {
        include: { product: true },
      },
    },
  });

  // 2. Mağaza Talepleri (Store Manager sadece kendi mağazası)
  const demands = await prisma.storeDemand.findMany({
    where:
      role === "STORE_MANAGER" && userStoreId
        ? { storeId: userStoreId }
        : undefined,
    include: {
      store: true,
      product: true,
      allocations: true,
    },
    orderBy: {
      store: { priority: "desc" },
    },
  });

  const products = await prisma.product.findMany({
    where: {
      stocks: {
        some: {
          quantity: { gt: 0 },
        },
      },
    },
    select: {
      id: true,
      name: true,
      sku: true,
    },
    orderBy: { name: "asc" },
  });

  // 4. Son Dağıtım Çalıştırması
  const latestRun = await prisma.allocationRun.findFirst({
    where: { items: { some: {} } },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        where: {
          ...(role === "STORE_MANAGER" && userStoreId
            ? { demand: { storeId: userStoreId } }
            : {}),
          ...(role === "WAREHOUSE_MANAGER" && userWarehouseId
            ? { warehouseId: userWarehouseId }
            : {}),
        },
        include: {
          product: true,
          warehouse: true,
          demand: { include: { store: true } },
        },
      },
    },
  });

  const totalWarehousesCount = warehouses.length;
  const totalDemandQuantity = demands.reduce(
    (acc, d) => acc + d.requestedQuantity,
    0,
  );
  const totalStoresWaitingCount = new Set(demands.map((d) => d.storeId)).size;

  // Karşılanamayan (Eksik Kalan) Taleplerin Hesaplanması
  const shortageList = demands
    .map((d) => {
      const allocatedForThisDemand =
        d.allocations?.reduce((sum, a) => sum + a.allocatedQty, 0) || 0;
      const missing = d.requestedQuantity - allocatedForThisDemand;

      return {
        demandId: d.id,
        storeName: d.store.name,
        productName: d.product.name,
        priority: d.store.priority,
        requested: d.requestedQuantity,
        allocated: allocatedForThisDemand,
        missing: missing > 0 ? missing : 0,
      };
    })
    .filter((item) => item.missing > 0);

  // 5. Onay Bekleyen Kullanıcılar (Sadece Admin görür)
  const pendingUsers =
    role === "ADMIN"
      ? await prisma.user.findMany({
          where: { isApproved: false },
          include: { store: true, warehouse: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Layers className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Akıllı Stok Dağıtım Sistemi
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Çoklu depo optimizasyonu ve talep karşılama platformu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Stok Yönetimi: Admin (İzleme) ve Warehouse Manager erişir */}
            {(role === "ADMIN" || role === "WAREHOUSE_MANAGER") && (
              <Link
                href="/inventory"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-xs sm:text-sm font-semibold shadow-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Envanter İzleme / Yönetim</span>
              </Link>
            )}

            {/* Talep Ekleme: Admin veya Store Manager */}
            {role === "STORE_MANAGER" && <AddDemandModal products={products} />}

            {/* Dağıtımı Çalıştır: YALNIZCA ADMIN */}
            {role === "ADMIN" && <RunButton />}
          </div>
        </header>

        {/* Admin & Yöneticiler İçin KPI Özet Kartları */}
        {role === "ADMIN" && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Toplam Bekleyen Talep
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                {totalDemandQuantity} Adet
              </p>
              <span className="text-xs text-amber-600 font-medium mt-1 inline-block">
                {totalStoresWaitingCount} Mağaza Bekliyor
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Toplam Dağıtım Maliyeti
              </span>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-2">
                {latestRun ? `₺${latestRun.totalCost.toFixed(2)}` : "₺0.00"}
              </p>
              <span className="text-xs text-slate-400 mt-1 inline-block">
                {latestRun ? "Hesaplanan kargo bedeli" : "Dağıtım bekleniyor"}
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Talep Karşılama Oranı
              </span>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-2">
                {latestRun ? `%${latestRun.fulfillmentRate.toFixed(1)}` : "-%"}
              </p>
              <span className="text-xs text-slate-400 mt-1 inline-block">
                {latestRun
                  ? `${latestRun.totalFulfilled} / ${latestRun.totalRequested} adet sevk edildi`
                  : "Planlama bekleniyor"}
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Aktif Depolar
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                {totalWarehousesCount} Depo
              </p>
              <span className="text-xs text-slate-400 mt-1 inline-block truncate w-full">
                {warehouses.map((w) => w.name).join(", ") || "Depo yok"}
              </span>
            </div>
          </section>
        )}

        {/* Onay Bekleyen Kullanıcı Talepleri (Yalnızca Admin) */}
        {role === "ADMIN" && pendingUsers.length > 0 && (
          <section className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                Onay Bekleyen Kullanıcı Kayıtları ({pendingUsers.length})
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingUsers.map((u) => (
                <div
                  key={u.id}
                  className="py-2.5 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div>
                    <span className="font-semibold text-slate-800">
                      {u.name}
                    </span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="text-slate-500">{u.email}</span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="font-medium text-indigo-600">
                      {u.role === "STORE_MANAGER"
                        ? `Mağaza: ${u.store?.name}`
                        : `Depo: ${u.warehouse?.name}`}
                    </span>
                  </div>

                  <UserApprovalButtons userId={u.id} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Kıtlık Uyarısı (Shortage Alert Paneli) */}
        {role === "ADMIN" && shortageList.length > 0 && (
          <section className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="w-full">
                <h3 className="text-sm font-bold text-amber-900">
                  Stok Yetersizliği Nedeniyle Karşılanamayan Talepler Var!
                </h3>
                <p className="text-xs text-amber-700 mt-1">
                  Toplam depo stoğu yetersiz kaldığından aşağıdaki talepler tam
                  olarak sevk edilemedi:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {shortageList.map((s) => (
                    <div
                      key={s.demandId}
                      className="bg-white p-3 rounded-xl border border-amber-200/80 text-xs shadow-sm"
                    >
                      <p className="font-semibold text-slate-800">
                        {s.storeName}
                      </p>
                      <p className="text-slate-500">{s.productName}</p>
                      <div className="mt-2 flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-slate-500">
                          İstenen / Verilen:
                        </span>
                        <span className="font-medium text-slate-700">
                          {s.requested} / {s.allocated}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-rose-600 font-bold mt-1">
                        <span>Eksik Kalan:</span>
                        <span>-{s.missing} Adet</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Mağaza Talepleri Tablosu */}
        <section className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-600" />
              Mağaza Talepleri{" "}
              {role !== "STORE_MANAGER" && "ve Öncelik Durumları"}
            </h2>

            {role === "STORE_MANAGER" && <AddDemandModal products={products} />}
          </div>

          <div className="border border-slate-100 rounded-xl overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-3">Mağaza</th>
                  {/* Mağaza müdürüyse Öncelik başlığını gizle */}
                  {role !== "STORE_MANAGER" && <th className="p-3">Öncelik</th>}
                  <th className="p-3">Ürün</th>
                  <th className="p-3 text-center">Talep</th>
                  <th className="p-3 text-center">Karşılanan</th>
                  <th className="p-3">Durum</th>
                  {(role === "ADMIN" || role === "STORE_MANAGER") && (
                    <th className="p-3 text-right">İşlem</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {demands.map((d) => {
                  const fulfilledQty =
                    d.allocations?.reduce(
                      (sum, a) => sum + a.allocatedQty,
                      0,
                    ) || 0;

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-800">
                        {d.store.name}
                      </td>

                      {/* Mağaza müdürüyse Öncelik hücresini gizle */}
                      {role !== "STORE_MANAGER" && (
                        <td className="p-3">
                          <StorePriorityForm
                            storeId={d.store.id}
                            initialPriority={d.store.priority}
                            canEdit={role === "WAREHOUSE_MANAGER"}
                          />
                        </td>
                      )}

                      <td className="p-3">{d.product.name}</td>
                      <td className="p-3 text-center font-semibold">
                        {d.requestedQuantity}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-600">
                        {fulfilledQty}
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100">
                          {d.status}
                        </span>
                      </td>
                      {(role === "ADMIN" || role === "STORE_MANAGER") && (
                        <td className="p-3 text-right">
                          <DeleteDemandButton demandId={d.id} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. Kısım: Dağıtım Çıktı Paneli */}
        <section className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600 shrink-0" />
              Oluşturulan Akıllı Sevkiyat Planı
            </h2>
            {latestRun && (
              <span className="text-xs text-slate-400 self-start sm:self-auto">
                Son Dağıtım:{" "}
                {new Date(latestRun.createdAt).toLocaleTimeString("tr-TR")}
              </span>
            )}
          </div>

          {!latestRun || latestRun.items.length === 0 ? (
            <div className="text-center py-10 sm:py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 px-4">
              <Truck className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                Henüz oluşturulmuş bir sevkiyat planı bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="border border-slate-100 rounded-xl overflow-x-auto w-full">
              <table className="w-full text-left text-sm text-slate-600 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="p-3">Çıkış Deposu</th>
                    <th className="p-3">Hedef Mağaza</th>
                    <th className="p-3">Ürün</th>
                    <th className="p-3 text-right">Sevk Miktarı</th>
                    <th className="p-3 text-right">Birim Maliyet</th>
                    <th className="p-3 text-right">Toplam Maliyet</th>
                    <th className="p-3 text-center">Süre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {latestRun.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-800 whitespace-nowrap">
                        {item.warehouse.name}
                      </td>
                      <td className="p-3 font-medium text-slate-800 whitespace-nowrap">
                        {item.demand.store.name}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {item.product.name}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {item.allocatedQty} Adet
                      </td>
                      <td className="p-3 text-right font-medium whitespace-nowrap">
                        ₺{item.unitCost}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₺{item.totalCost}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {item.deliveryDays} Gün
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
