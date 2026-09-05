// src/lib/allocation-engine.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  runSmartAllocation,
  DemandInput,
  StockInput,
  RouteInput,
} from "../app/lib/allocation-engine";

describe("Akıllı Stok Dağıtım Algoritması (Allocation Engine)", () => {
  // Test Senaryosu 1: Yüksek Öncelikli Mağazanın Kıt Stoğu Alması
  it("kıt stok durumunda önceliği yüksek olan mağazaya öncelik vermelidir", () => {
    const demands: DemandInput[] = [
      {
        demandId: "d-low",
        storeId: "s-normal",
        storeName: "Normal Mağaza",
        storePriority: 1,
        productId: "p1",
        productName: "Laptop",
        requestedQty: 10,
        createdAt: new Date("2026-01-01"),
      },
      {
        demandId: "d-high",
        storeId: "s-priority",
        storeName: "Öncelikli Mağaza",
        storePriority: 3,
        productId: "p1",
        productName: "Laptop",
        requestedQty: 10,
        createdAt: new Date("2026-01-02"),
      },
    ];

    const stocks: StockInput[] = [
      {
        warehouseId: "w1",
        warehouseName: "Ana Depo",
        productId: "p1",
        availableQty: 10,
      },
    ];

    const routes: RouteInput[] = [
      {
        warehouseId: "w1",
        storeId: "s-normal",
        shippingCost: 10,
        deliveryDays: 1,
      },
      {
        warehouseId: "w1",
        storeId: "s-priority",
        shippingCost: 10,
        deliveryDays: 1,
      },
    ];

    const warehouses = [{ id: "w1", capacity: 1000 }];

    const result = runSmartAllocation(demands, stocks, routes, warehouses);

    assert.equal(result.totalFulfilled, 10);
    assert.equal(result.allocations.length, 1);
    assert.equal(result.allocations[0].storeId, "s-priority");
    assert.equal(result.allocations[0].allocatedQty, 10);

    assert.equal(result.unfulfilledDemands.length, 1);
    assert.equal(result.unfulfilledDemands[0].demandId, "d-low");
    assert.equal(result.unfulfilledDemands[0].reason, "YETERSİZ STOK MİKTARI");
  });

  // Test Senaryosu 2: Deterministik Tie-Breaking (FIFO Eşitlik Çözümü)
  it("öncelikler eşit olduğunda talebi daha önce açılan mağazaya vermelidir (FIFO)", () => {
    const demands: DemandInput[] = [
      {
        demandId: "d-late",
        storeId: "s-late",
        storeName: "Geç Açılan Mağaza",
        storePriority: 2,
        productId: "p1",
        productName: "Telefon",
        requestedQty: 5,
        createdAt: new Date("2026-02-05"),
      },
      {
        demandId: "d-early",
        storeId: "s-early",
        storeName: "Erken Açılan Mağaza",
        storePriority: 2,
        productId: "p1",
        productName: "Telefon",
        requestedQty: 5,
        createdAt: new Date("2026-02-01"),
      },
    ];

    const stocks: StockInput[] = [
      {
        warehouseId: "w1",
        warehouseName: "Ana Depo",
        productId: "p1",
        availableQty: 5,
      },
    ];

    const routes: RouteInput[] = [
      {
        warehouseId: "w1",
        storeId: "s-late",
        shippingCost: 10,
        deliveryDays: 1,
      },
      {
        warehouseId: "w1",
        storeId: "s-early",
        shippingCost: 10,
        deliveryDays: 1,
      },
    ];

    const warehouses = [{ id: "w1", capacity: 1000 }];

    const result = runSmartAllocation(demands, stocks, routes, warehouses);

    assert.equal(result.allocations[0].demandId, "d-early");
    assert.equal(result.allocations[0].allocatedQty, 5);
  });

  // Test Senaryosu 3: En Düşük Maliyetli Rota Tercihi
  it("aynı şartlarda en düşük maliyetli rotaya sahip depoyu tercih etmelidir", () => {
    const demands: DemandInput[] = [
      {
        demandId: "d-1",
        storeId: "s-1",
        storeName: "Kadıköy Şube",
        storePriority: 1,
        productId: "p1",
        productName: "Tablet",
        requestedQty: 10,
      },
    ];

    const stocks: StockInput[] = [
      {
        warehouseId: "w-expensive",
        warehouseName: "Pahalı Depo",
        productId: "p1",
        availableQty: 10,
      },
      {
        warehouseId: "w-cheap",
        warehouseName: "Ucuz Depo",
        productId: "p1",
        availableQty: 10,
      },
    ];

    const routes: RouteInput[] = [
      {
        warehouseId: "w-expensive",
        storeId: "s-1",
        shippingCost: 50,
        deliveryDays: 1,
      },
      {
        warehouseId: "w-cheap",
        storeId: "s-1",
        shippingCost: 15,
        deliveryDays: 1,
      },
    ];

    const warehouses = [
      { id: "w-expensive", capacity: 1000 },
      { id: "w-cheap", capacity: 1000 },
    ];

    const result = runSmartAllocation(demands, stocks, routes, warehouses);

    assert.equal(result.allocations[0].warehouseId, "w-cheap");
    assert.equal(result.allocations[0].unitCost, 15);
    assert.equal(result.totalCost, 150);
  });
});
