// src/lib/allocation-engine.ts

export interface DemandInput {
  demandId: string;
  storeId: string;
  storeName: string;
  storePriority: number; // 4: Kritik, 3: Yüksek, 2: Orta, 1: Düşük
  productId: string;
  productName: string;
  requestedQty: number;
  createdAt?: string | Date; // FIFO sıralaması için opsiyonel tarih
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
    reason: string;
  }[];
}

/**
 * Akıllı Çok Kriterli Greedy Stok Dağıtım Algoritması (Multi-Criteria Greedy Allocation)
 * Sıralama Kriterleri:
 * 1. Mağaza Önceliği (Azalan sıra)
 * 2. Eşitlik Durumunda (Tie-breaking): FIFO / Deterministik Talep Kimliği
 *
 * Zaman Karmaşıklığı (Time Complexity): O(D * log(D) + D * W * log(W))
 * D: Talep sayısı, W: Depo sayısı
 */
export function runSmartAllocation(
  demands: DemandInput[],
  initialStocks: StockInput[],
  routes: RouteInput[],
  warehouses: { id: string; capacity: number }[],
  weights = { costWeight: 0.7, timeWeight: 0.3 },
): AllocationEngineResult {
  const stockMap = new Map<string, number>();
  initialStocks.forEach((s) =>
    stockMap.set(`${s.warehouseId}:${s.productId}`, s.availableQty),
  );

  const routeMap = new Map<string, RouteInput>();
  routes.forEach((r) => routeMap.set(`${r.warehouseId}:${r.storeId}`, r));

  // 1. DETERMINISTIK TALEP SIRALAMASI (Tie-breaking Kuralı)
  const sortedDemands = [...demands].sort((a, b) => {
    // 1. Öncelik Seviyesi (Büyükten küçüğe)
    if (b.storePriority !== a.storePriority) {
      return b.storePriority - a.storePriority;
    }

    // 2. Eşitlik Halinde: Tarih varsa eskiden yeniye (FIFO)
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    // 3. Tarih yoksa deterministik Demand ID sıralaması (Rastgeleliği tamamen önler)
    return a.demandId.localeCompare(b.demandId);
  });

  const allocations: AllocationResultItem[] = [];
  const unfulfilledDemands: AllocationEngineResult["unfulfilledDemands"] = [];

  let totalRequested = 0;
  let totalFulfilled = 0;
  let totalCost = 0;

  for (const demand of sortedDemands) {
    totalRequested += demand.requestedQty;
    let remainingToFulfill = demand.requestedQty;

    // Aday depoları filtreleme ve skorlama
    const scoredWarehouses = initialStocks
      .filter((s) => s.productId === demand.productId)
      .map((s) => {
        const route = routeMap.get(`${s.warehouseId}:${demand.storeId}`);
        const currentStock =
          stockMap.get(`${s.warehouseId}:${demand.productId}`) || 0;
        const warehouseInfo = warehouses.find((w) => w.id === s.warehouseId);

        if (!route || currentStock <= 0) return null;

        // Çok Kriterli Karar Verme Skoru (Maliyet %70, Hız %30)
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
      .sort((a, b) => {
        // En düşük skora sahip depodan başla
        if (a.score !== b.score) {
          return a.score - b.score;
        }
        // Eşit maliyet/süre varsa sabit depo sıralaması
        return a.warehouseId.localeCompare(b.warehouseId);
      });

    for (const cand of scoredWarehouses) {
      if (remainingToFulfill <= 0) break;

      const currentAvailable =
        stockMap.get(`${cand.warehouseId}:${demand.productId}`) || 0;
      if (currentAvailable <= 0) continue;

      const allocateAmount = Math.min(remainingToFulfill, currentAvailable);

      // Sanal stok ve sayaç güncellemeleri
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
      const productInStock = initialStocks.filter(
        (s) => s.productId === demand.productId,
      );
      const totalStockAcrossWarehouses = productInStock.reduce(
        (sum, s) => sum + s.availableQty,
        0,
      );

      let reason = "STOK YETERSİZ";
      if (totalStockAcrossWarehouses > 0) {
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
