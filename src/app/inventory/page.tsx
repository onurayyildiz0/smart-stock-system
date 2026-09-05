import { prisma } from "../lib/prisma";
import { Warehouse, PackageX } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import AddStockModal from "../components/AddStockModal";
import StockRowActions from "../components/StockRowActions";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const role = user?.role || "USER";

  // Store Manager envantere giremez
  if (role === "STORE_MANAGER") {
    redirect("/");
  }

  const userWarehouseId = user?.warehouseId;

  // Warehouse Manager sadece kendi deposunu görür, Admin tüm depoları görür
  const warehouses = await prisma.warehouse.findMany({
    where:
      role === "WAREHOUSE_MANAGER" && userWarehouseId
        ? { id: userWarehouseId }
        : undefined,
    include: {
      stocks: {
        include: { product: true },
        orderBy: { product: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Envanter & Stok Durumu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {role === "ADMIN"
              ? "Tüm depoların ve ürünlerin anlık stok durumu (Salt Okunur)."
              : "Deponuza ait stokları buradan ekleyebilir, silebilir veya miktarlarını güncelleyebilirsiniz."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {warehouses.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500">
            Kayıtlı depo bulunamadı.
          </div>
        ) : (
          warehouses.map((wh) => (
            <div
              key={wh.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Warehouse size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-base">
                      {wh.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {wh.location} | Kapasite: {wh.capacity}
                    </p>
                  </div>
                </div>

                {role === "WAREHOUSE_MANAGER" && (
                  <AddStockModal warehouseId={wh.id} warehouseName={wh.name} />
                )}
              </div>

              {wh.stocks.length === 0 ? (
                <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
                  <PackageX className="w-8 h-8 text-slate-300" />
                  <p className="text-sm font-medium">
                    Bu depoda henüz tanımlı stok yok.
                  </p>
                  {role === "WAREHOUSE_MANAGER" && (
                    <p className="text-xs text-slate-400">
                      Yukarıdaki butonu kullanarak depoya ilk ürününüzü
                      ekleyebilirsiniz.
                    </p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/60 text-slate-400 text-xs uppercase font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">Ürün Adı</th>
                        <th className="px-6 py-3">SKU</th>
                        <th className="px-6 py-3 text-center">Mevcut Stok</th>
                        {role === "WAREHOUSE_MANAGER" && (
                          <th className="px-6 py-3 text-right">
                            Miktar Güncelle / Kaldır
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {wh.stocks.map((stock) => (
                        <tr
                          key={stock.id}
                          className="hover:bg-slate-50/50 transition"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {stock.product.name}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-500">
                            {stock.product.sku}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-emerald-600">
                            {stock.quantity}
                          </td>
                          {role === "WAREHOUSE_MANAGER" && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end">
                                <StockRowActions
                                  stockId={stock.id}
                                  initialQuantity={stock.quantity}
                                />
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
