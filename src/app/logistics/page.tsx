import { prisma } from "../lib/prisma";
import { Truck, MapPin } from "lucide-react";
import RouteUpdateForm from "../components/RouteUpdateForm";

export default async function LogisticsPage() {
  const [warehouses, stores, routes] = await Promise.all([
    prisma.warehouse.findMany(),
    prisma.store.findMany(),
    prisma.warehouseRoute.findMany()
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Lojistik Rota & Maliyet Yönetimi</h1>
        <p className="text-slate-500 text-sm mt-1">
          Depolardan mağazalara gönderim maliyetlerini ve teslimat sürelerini buradan ayarlayın.
          Algoritma en düşük maliyetli rotayı otomatik seçecektir.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Depo</th>
              <th className="px-6 py-4">Hedef Mağaza</th>
              <th className="px-6 py-4 text-center">Birim Maliyet (₺)</th>
              <th className="px-6 py-4 text-center">Teslimat (Gün)</th>
              <th className="px-6 py-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {warehouses.map((wh) => (
              stores.map((store) => {
                const route = routes.find(
                  r => r.warehouseId === wh.id && r.storeId === store.id
                );
                return (
                  <tr key={`${wh.id}-${store.id}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-indigo-500" />
                        {wh.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        {store.name}
                      </div>
                    </td>
                    <RouteUpdateForm 
                      warehouseId={wh.id} 
                      storeId={store.id} 
                      initialCost={route?.shippingCost ?? 0}
                      initialDays={route?.deliveryDays ?? 0}
                    />
                  </tr>
                )
              })
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}