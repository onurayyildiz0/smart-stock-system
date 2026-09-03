import { prisma } from "../lib/prisma";
import { Warehouse } from "lucide-react";
import StockUpdateForm from "../components/StockUpdateForm";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";

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
      },
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Envanter & Stok Durumu
        </h1>
        <p className="text-slate-500">
          {role === "ADMIN"
            ? "Tüm depoların ve ürünlerin anlık stok durumu (Salt Okunur)."
            : "Deponuza ait stok miktarlarını buradan güncelleyebilirsiniz."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Warehouse size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{wh.name}</h2>
                <p className="text-xs text-slate-500">
                  {wh.location} | Kapasite: {wh.capacity}
                </p>
              </div>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">Ürün Adı</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3 text-center">Mevcut Stok</th>
                  {role === "WAREHOUSE_MANAGER" && (
                    <th className="px-6 py-3 text-right">Stok Güncelle</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wh.stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {stock.product.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {stock.product.sku}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {stock.quantity}
                    </td>
                    {role === "WAREHOUSE_MANAGER" && (
                      <td className="px-6 py-4 text-right text-black">
                        <StockUpdateForm
                          stockId={stock.id}
                          initialQty={stock.quantity}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
