// src/lib/allocation-engine.ts

export interface DemandInput {
  demandId: string;
  storeId: string;
  storeName: string;
  storePriority: number; // 3: Yüksek, 2: Orta, 1: Normal
  productId: string;
  productName: string;
  requestedQty: number;
}

export interface StockInput {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  availableQty: number;
}

export interface RouteInput {
  warehouseId: string;
  storeId: string;
  shippingCost: number;
  deliveryDays: number;
}

export interface AllocationResultItem {
  demandId: string;
  storeId: string;
  warehouseId: string;
  productId: string;
  allocatedQty: number;
  unitCost: number;
  totalCost: number;
  deliveryDays: number;
}

export interface AllocationEngineResult {
  allocations: AllocationResultItem[];
  totalRequested: number;
  totalFulfilled: number;
  fulfillmentRate: number;
  totalCost: number;
  unfulfilledDemands: {
    demandId: string;
    storeName: string;
    productName: string;
    missingQty: number;
    reason: string; // <-- Bu satırı ekle
  }[];
}

/**
 * Akıllı Stok Dağıtım Algoritması (Multi-Criteria Greedy Allocation)
 * Zaman Karmaşıklığı (Time Complexity): O(D * log(D) + D * W * log(W))
 * D: Talep sayısı, W: Depo sayısı
 */

export function runSmartAllocation(
  demands: DemandInput[],
  initialStocks: StockInput[],
  routes: RouteInput[],
  warehouses: { id: string; capacity: number }[], // Kapasite için yeni girdi
  weights = { costWeight: 0.7, timeWeight: 0.3 },
): AllocationEngineResult {
  const stockMap = new Map<string, number>();
  initialStocks.forEach((s) =>
    stockMap.set(`${s.warehouseId}:${s.productId}`, s.availableQty),
  );

  // DEPO DOLULUK TAKİBİ (Yeni)
  const warehouseUsageMap = new Map<string, number>();
  // Mevcut toplam stokları başlangıç doluluğu olarak alalım
  initialStocks.forEach((s) => {
    const current = warehouseUsageMap.get(s.warehouseId) || 0;
    warehouseUsageMap.set(s.warehouseId, current + s.availableQty);
  });

  const routeMap = new Map<string, RouteInput>();
  routes.forEach((r) => routeMap.set(`${r.warehouseId}:${r.storeId}`, r));

  const sortedDemands = [...demands].sort(
    (a, b) => b.storePriority - a.storePriority,
  );
  const allocations: AllocationResultItem[] = [];
  const unfulfilledDemands: AllocationEngineResult["unfulfilledDemands"] = [];

  let totalRequested = 0;
  let totalFulfilled = 0;
  let totalCost = 0;

  for (const demand of sortedDemands) {
    totalRequested += demand.requestedQty;
    let remainingToFulfill = demand.requestedQty;

    const scoredWarehouses = initialStocks
      .filter((s) => s.productId === demand.productId)
      .map((s) => {
        const route = routeMap.get(`${s.warehouseId}:${demand.storeId}`);
        const currentStock =
          stockMap.get(`${s.warehouseId}:${demand.productId}`) || 0;
        const warehouseInfo = warehouses.find((w) => w.id === s.warehouseId);

        if (!route || currentStock <= 0) return null;

        // Basit Skorlama: Düşük maliyet ve kısa süre iyidir.
        const score =
          route.shippingCost * weights.costWeight +
          route.deliveryDays * 5 * weights.timeWeight;

        return {
          warehouseId: s.warehouseId,
          stock: currentStock,
          route,
          score,
          capacity: warehouseInfo?.capacity || 999999,
        };
      })
      .filter((w): w is NonNullable<typeof w> => w !== null)
      .sort((a, b) => a.score - b.score);

    for (const cand of scoredWarehouses) {
      if (remainingToFulfill <= 0) break;

      const currentAvailable =
        stockMap.get(`${cand.warehouseId}:${demand.productId}`) || 0;
      if (currentAvailable <= 0) continue;

      const allocateAmount = Math.min(remainingToFulfill, currentAvailable);

      // Stok ve Maliyet Güncelleme
      stockMap.set(
        `${cand.warehouseId}:${demand.productId}`,
        currentAvailable - allocateAmount,
      );
      remainingToFulfill -= allocateAmount;
      totalFulfilled += allocateAmount;
      totalCost += allocateAmount * cand.route.shippingCost;

      allocations.push({
        demandId: demand.demandId,
        storeId: demand.storeId,
        warehouseId: cand.warehouseId,
        productId: demand.productId,
        allocatedQty: allocateAmount,
        unitCost: cand.route.shippingCost,
        totalCost: allocateAmount * cand.route.shippingCost,
        deliveryDays: cand.route.deliveryDays,
      });
    }

    if (remainingToFulfill > 0) {
      // Ürün hiç mi yok, yoksa var ama rota mı tanımlanmamış?
      const productInStock = initialStocks.filter(
        (s) => s.productId === demand.productId,
      );
      const totalStockAcrossWarehouses = productInStock.reduce(
        (sum, s) => sum + s.availableQty,
        0,
      );

      let reason = "STOK YETERSİZ";

      if (totalStockAcrossWarehouses > 0) {
        // Stok var ama bu mağazaya ulaşamıyor olabilir
        const hasRoute = productInStock.some((s) =>
          routeMap.has(`${s.warehouseId}:${demand.storeId}`),
        );
        reason = hasRoute ? "YETERSİZ STOK MİKTARI" : "ROTA TANIMLANMAMIŞ";
      }

      unfulfilledDemands.push({
        demandId: demand.demandId,
        storeName: demand.storeName,
        productName: demand.productName,
        missingQty: remainingToFulfill,
        reason: reason,
      });
    }
  }

  return {
    allocations,
    totalRequested,
    totalFulfilled,
    fulfillmentRate:
      totalRequested > 0
        ? Number(((totalFulfilled / totalRequested) * 100).toFixed(1))
        : 100,
    totalCost: Number(totalCost.toFixed(2)),
    unfulfilledDemands,
  };
}
