import { prisma } from "../lib/prisma";
import { Package, Warehouse, ArrowRight, Settings2 } from "lucide-react";
import StockUpdateForm from "../components/StockUpdateForm";
import DeleteWarehouseButton from "../components/DeleteWarehouseButton";
import DeleteStockButton from "../components/DeleteStockButton";

// Yeni oluşturduğumuz modalları import ediyoruz
import AddWarehouseModal from "../components/AddWarehouseModal";
import AddProductModal from "../components/AddProductModal";

export default async function InventoryPage() {
  const warehouses = await prisma.warehouse.findMany({
    include: {
      stocks: {
        include: { product: true },
      },
    },
  });

  // Ürün ekleme modalına göndermek için depoların sadece id ve isimlerini alıyoruz
  const warehouseOptions = warehouses.map((w) => ({ id: w.id, name: w.name }));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* ÜST BAŞLIK VE EYLEM BUTONLARI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Envanter & Depo Yönetimi
          </h1>
          <p className="text-slate-500">
            Depo bazlı stok miktarlarını ve ürün dağılımlarını yönetin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AddWarehouseModal />
          <AddProductModal warehouses={warehouseOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Warehouse size={20} />
                </div>
                <div>
                  <DeleteWarehouseButton warehouseId={wh.id} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">{wh.name}</h2>
                  <p className="text-xs text-slate-500">
                    {wh.location} | Kapasite: {wh.capacity}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Ürün Adı</th>
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3 text-center">Mevcut Stok</th>
                    <th className="px-6 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wh.stocks.map((stock) => (
                    <tr
                      key={stock.id}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {stock.product.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {stock.product.sku}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full font-bold ${stock.quantity < 10 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}
                        >
                          {stock.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StockUpdateForm
                          stockId={stock.id}
                          initialQty={stock.quantity}
                        />
                        <DeleteStockButton stockId={stock.id} />
                      </td>
                    </tr>
                  ))}
                  {wh.stocks.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-slate-400 italic"
                      >
                        Bu depoda henüz tanımlı stok bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
