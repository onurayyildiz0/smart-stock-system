// src/app/page.tsx
import React from "react";
import { prisma } from "./lib/prisma";
import RunButton from "./components/RunButton";
import AddDemandModal from "./components/AddDemandModal";
import { 
  Building2, 
  Warehouse, 
  TrendingUp, 
  CheckCircle2, 
  Truck,
  Layers,
  AlertTriangle
} from "lucide-react";

export default async function DashboardPage() {
  // 1. Depolar ve Stoklar
  const warehouses = await prisma.warehouse.findMany({
    include: {
      stocks: {
        include: { product: true }
      }
    }
  });

  // 2. Mağaza Talepleri
  const demands = await prisma.storeDemand.findMany({
    include: {
      store: true,
      product: true,
      allocations: true
    },
    orderBy: {
      store: { priority: "desc" }
    }
  });

  // 3. Form için Mağaza ve Ürün Listesi
  const stores = await prisma.store.findMany({ select: { id: true, name: true } });
  const products = await prisma.product.findMany({ select: { id: true, name: true } });

  // 4. En Son Yapılan Dağıtım Çalıştırması
  const latestRun = await prisma.allocationRun.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true,
          warehouse: true,
          demand: {
            include: { store: true }
          }
        }
      }
    }
  });

  // Metrikler
  const totalWarehousesCount = warehouses.length;
  const totalDemandQuantity = demands.reduce((acc, d) => acc + d.requestedQuantity, 0);
  const totalStoresWaitingCount = new Set(demands.map(d => d.storeId)).size;

  // Karşılanamayan (Eksik Kalan) Taleplerin Hesaplanması
  const shortageList = latestRun
    ? demands.map((d) => {
        const allocatedForThisDemand = latestRun.items
          .filter((item) => item.demandId === d.id)
          .reduce((acc, curr) => acc + curr.allocatedQty, 0);
        
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
      }).filter(item => item.missing > 0)
    : [];

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Üst Başlık ve Aksiyon Butonları */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Layers className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Akıllı Stok Dağıtım Sistemi
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Çoklu depo optimizasyonu, talep karşılama ve lojistik maliyet analizi.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <AddDemandModal stores={stores} products={products} />
            <RunButton />
          </div>
        </header>

        {/* KPI Özet Kartları */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Depo</span>
              <Warehouse className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{totalWarehousesCount} Aktif</p>
            <span className="text-xs text-slate-400 mt-1 inline-block truncate">
              {warehouses.map(w => w.location).join(", ")}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Talep</span>
              <Building2 className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{totalDemandQuantity} Adet</p>
            <span className="text-xs text-amber-600 font-medium mt-1 inline-block">
              {totalStoresWaitingCount} Farklı Mağaza
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Maliyet</span>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {latestRun ? `₺${latestRun.totalCost.toFixed(2)}` : "₺0.00"}
            </p>
            <span className="text-xs text-slate-400 mt-1 inline-block">
              {latestRun ? "Hesaplanan kargo maliyeti" : "Planlama bekleniyor"}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Karşılama Oranı</span>
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {latestRun ? `%${latestRun.fulfillmentRate}` : "-%"}
            </p>
            <span className="text-xs text-slate-400 mt-1 inline-block">
              {latestRun ? `${latestRun.totalFulfilled} / ${latestRun.totalRequested} adet sevk edildi` : "Henüz hesaplanmadı"}
            </span>
          </div>
        </section>

        {/* Kıtlık Uyarısı (Shortage Alert Paneli) */}
        {latestRun && shortageList.length > 0 && (
          <section className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="w-full">
                <h3 className="text-sm font-bold text-amber-900">
                  Stok Yetersizliği Nedeniyle Karşılanamayan Talepler Var!
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Toplam stok yetersiz kaldığından algoritma yüksek öncelikli mağazaları öncelemiş, kalan talepleri eksik bırakmıştır:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {shortageList.map((s, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-amber-200/80 text-xs shadow-2xs">
                      <p className="font-semibold text-slate-800">{s.storeName}</p>
                      <p className="text-slate-500">{s.productName}</p>
                      <div className="mt-2 flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-slate-500">İstenen / Verilen:</span>
                        <span className="font-medium text-slate-700">{s.requested} / {s.allocated}</span>
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

        {/* 1. Kısım: Girdiler */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Sol: Depolar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-slate-600" />
                Depo Stok Durumları
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                Kaynak Envanter
              </span>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="p-3">Depo</th>
                    <th className="p-3">Ürün</th>
                    <th className="p-3 text-right">Mevcut Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {warehouses.flatMap((w) =>
                    w.stocks.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-800">{w.name}</td>
                        <td className="p-3">{s.product.name}</td>
                        <td className="p-3 text-right font-semibold text-indigo-600">{s.quantity} Adet</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sağ: Mağaza Talepleri */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-600" />
                Mağaza Talepleri & Öncelikler
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                Hedef İhtiyaçlar
              </span>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="p-3">Mağaza</th>
                    <th className="p-3">Ürün</th>
                    <th className="p-3">Öncelik</th>
                    <th className="p-3 text-right">Talep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {demands.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-800">{d.store.name}</td>
                      <td className="p-3 text-slate-600">{d.product.name}</td>
                      <td className="p-3">
                        {d.store.priority === 3 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                            Yüksek (Tier 3)
                          </span>
                        )}
                        {d.store.priority === 2 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            Orta (Tier 2)
                          </span>
                        )}
                        {d.store.priority === 1 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            Standart (Tier 1)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-900">
                        {d.requestedQuantity} Adet
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </section>

        {/* 2. Kısım: Dağıtım Çıktı Paneli */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Oluşturulan Akıllı Sevkiyat Planı
            </h2>
            {latestRun && (
              <span className="text-xs text-slate-400">
                Son Dağıtım: {new Date(latestRun.createdAt).toLocaleTimeString("tr-TR")}
              </span>
            )}
          </div>

          {!latestRun || latestRun.items.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">Henüz bir dağıtım planı oluşturulmadı.</p>
              <p className="text-xs text-slate-400 mt-1">
                Yukarıdaki "Optimizasyonu Çalıştır" butonuna basarak algoritmayı test edebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
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
                      <td className="p-3 font-medium text-slate-800">{item.warehouse.name}</td>
                      <td className="p-3 font-medium text-slate-800">{item.demand.store.name}</td>
                      <td className="p-3">{item.product.name}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {item.allocatedQty} Adet
                      </td>
                      <td className="p-3 text-right font-medium">₺{item.unitCost}</td>
                      <td className="p-3 text-right font-bold text-slate-900">₺{item.totalCost}</td>
                      <td className="p-3 text-center">
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