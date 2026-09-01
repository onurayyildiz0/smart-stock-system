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
  weights = { costWeight: 0.7, timeWeight: 0.3 }
): AllocationEngineResult {
  // 1. Stok durumunu dinamik takip etmek için Map yapısı (O(1) hızlı erişim)
  const stockMap = new Map<string, number>();
  initialStocks.forEach((s) => {
    stockMap.set(`${s.warehouseId}:${s.productId}`, s.availableQty);
  });

  // 2. Rota ve maliyet bilgileri için Map
  const routeMap = new Map<string, RouteInput>();
  routes.forEach((r) => {
    routeMap.set(`${r.warehouseId}:${r.storeId}`, r);
  });

  // 3. Önceliklendirme: Önce yüksek öncelikli mağazalar (3 > 2 > 1)
  const sortedDemands = [...demands].sort((a, b) => {
    if (b.storePriority !== a.storePriority) {
      return b.storePriority - a.storePriority;
    }
    return a.requestedQty - b.requestedQty;
  });

  const allocations: AllocationResultItem[] = [];
  const unfulfilledDemands: AllocationEngineResult["unfulfilledDemands"] = [];

  let totalRequested = 0;
  let totalFulfilled = 0;
  let totalCost = 0;

  // 4. Talepleri en uygun depolardan karşıla
  for (const demand of sortedDemands) {
    totalRequested += demand.requestedQty;
    let remainingToFulfill = demand.requestedQty;

    // Ürüne sahip depoları filtrele
    const candidateWarehouseIds = initialStocks
      .filter((s) => s.productId === demand.productId)
      .map((s) => s.warehouseId);

    // Depoları Maliyet ve Teslimat Süresine göre puanla (Düşük Skor = Daha İyi)
    const scoredWarehouses = candidateWarehouseIds
      .map((wId) => {
        const route = routeMap.get(`${wId}:${demand.storeId}`);
        const currentStock = stockMap.get(`${wId}:${demand.productId}`) || 0;

        if (!route || currentStock <= 0) return null;

        const score =
          route.shippingCost * weights.costWeight +
          route.deliveryDays * 10 * weights.timeWeight;

        return {
          warehouseId: wId,
          stock: currentStock,
          route,
          score,
        };
      })
      .filter((w): w is NonNullable<typeof w> => w !== null)
      .sort((a, b) => a.score - b.score);

    // En uygun depodan başla ve parçalı dağıtım (Split Allocation) yap
    for (const cand of scoredWarehouses) {
      if (remainingToFulfill <= 0) break;

      const currentAvailable = stockMap.get(`${cand.warehouseId}:${demand.productId}`) || 0;
      if (currentAvailable <= 0) continue;

      const allocateAmount = Math.min(remainingToFulfill, currentAvailable);

      // Depo stoğunu düş
      stockMap.set(`${cand.warehouseId}:${demand.productId}`, currentAvailable - allocateAmount);
      remainingToFulfill -= allocateAmount;
      totalFulfilled += allocateAmount;

      const itemCost = allocateAmount * cand.route.shippingCost;
      totalCost += itemCost;

      allocations.push({
        demandId: demand.demandId,
        storeId: demand.storeId,
        warehouseId: cand.warehouseId,
        productId: demand.productId,
        allocatedQty: allocateAmount,
        unitCost: cand.route.shippingCost,
        totalCost: itemCost,
        deliveryDays: cand.route.deliveryDays,
      });
    }

    // Karşılanamayan açık talep varsa kaydet
    if (remainingToFulfill > 0) {
      unfulfilledDemands.push({
        demandId: demand.demandId,
        storeName: demand.storeName,
        productName: demand.productName,
        missingQty: remainingToFulfill,
      });
    }
  }

  const fulfillmentRate = totalRequested > 0 ? (totalFulfilled / totalRequested) * 100 : 0;

  return {
    allocations,
    totalRequested,
    totalFulfilled,
    fulfillmentRate: Number(fulfillmentRate.toFixed(1)),
    totalCost: Number(totalCost.toFixed(2)),
    unfulfilledDemands,
  };
}