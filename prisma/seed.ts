// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Önce eski veriler varsa temizleyelim
  await prisma.allocationItem.deleteMany();
  await prisma.allocationRun.deleteMany();
  await prisma.storeDemand.deleteMany();
  await prisma.warehouseRoute.deleteMany();
  await prisma.warehouseStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.warehouse.deleteMany();

  // 1. Ürünler
  const p1 = await prisma.product.create({
    data: { sku: "PRD-LAPTOP", name: "Pro Laptop 16", category: "Elektronik" },
  });
  const p2 = await prisma.product.create({
    data: { sku: "PRD-PHONE", name: "Smart Phone Ultra", category: "Elektronik" },
  });
  const p3 = await prisma.product.create({
    data: { sku: "PRD-HEADSET", name: "ANC Kulaklık", category: "Aksesuar" },
  });

  // 2. Depolar
  const wIstanbul = await prisma.warehouse.create({
    data: { name: "Ana Depo - İstanbul (Tuzla)", location: "İstanbul", capacity: 10000 },
  });
  const wAnkara = await prisma.warehouse.create({
    data: { name: "İç Anadolu Depo - Ankara", location: "Ankara", capacity: 5000 },
  });
  const wIzmir = await prisma.warehouse.create({
    data: { name: "Ege Depo - İzmir", location: "İzmir", capacity: 4000 },
  });

  // 3. Mağazalar (Öncelik: 3 = Yüksek/Flagship, 2 = Orta, 1 = Normal)
  const sKanyon = await prisma.store.create({
    data: { name: "Kanyon AVM Flagship", location: "İstanbul", priority: 3 },
  });
  const sKizilay = await prisma.store.create({
    data: { name: "Kızılay Şube", location: "Ankara", priority: 2 },
  });
  const sAlsancak = await prisma.store.create({
    data: { name: "Alsancak Şube", location: "İzmir", priority: 2 },
  });
  const sBursa = await prisma.store.create({
    data: { name: "Bursa Nilüfer Şube", location: "Bursa", priority: 1 },
  });

  // 4. Depo Stokları (Laptop için kasıtlı olarak stok yetersizliği senaryosu kuruyoruz)
  // Toplam Laptop Stoğu: 40 + 20 + 10 = 70 Adet
  await prisma.warehouseStock.createMany({
    data: [
      { warehouseId: wIstanbul.id, productId: p1.id, quantity: 40 },
      { warehouseId: wAnkara.id, productId: p1.id, quantity: 20 },
      { warehouseId: wIzmir.id, productId: p1.id, quantity: 10 },
      { warehouseId: wIstanbul.id, productId: p2.id, quantity: 200 },
      { warehouseId: wAnkara.id, productId: p2.id, quantity: 150 },
      { warehouseId: wIzmir.id, productId: p3.id, quantity: 80 },
    ],
  });

  // 5. Kargo Rota Matrisi (Maliyet TL ve Süre Gün)
  await prisma.warehouseRoute.createMany({
    data: [
      // İstanbul Depo Çıkışlı
      { warehouseId: wIstanbul.id, storeId: sKanyon.id, shippingCost: 15, deliveryDays: 1 },
      { warehouseId: wIstanbul.id, storeId: sKizilay.id, shippingCost: 45, deliveryDays: 2 },
      { warehouseId: wIstanbul.id, storeId: sAlsancak.id, shippingCost: 50, deliveryDays: 2 },
      { warehouseId: wIstanbul.id, storeId: sBursa.id, shippingCost: 25, deliveryDays: 1 },

      // Ankara Depo Çıkışlı
      { warehouseId: wAnkara.id, storeId: sKanyon.id, shippingCost: 40, deliveryDays: 2 },
      { warehouseId: wAnkara.id, storeId: sKizilay.id, shippingCost: 10, deliveryDays: 1 },
      { warehouseId: wAnkara.id, storeId: sAlsancak.id, shippingCost: 45, deliveryDays: 2 },
      { warehouseId: wAnkara.id, storeId: sBursa.id, shippingCost: 35, deliveryDays: 2 },

      // İzmir Depo Çıkışlı
      { warehouseId: wIzmir.id, storeId: sKanyon.id, shippingCost: 55, deliveryDays: 2 },
      { warehouseId: wIzmir.id, storeId: sKizilay.id, shippingCost: 45, deliveryDays: 2 },
      { warehouseId: wIzmir.id, storeId: sAlsancak.id, shippingCost: 12, deliveryDays: 1 },
      { warehouseId: wIzmir.id, storeId: sBursa.id, shippingCost: 30, deliveryDays: 2 },
    ],
  });

  // 6. Mağaza Talepleri
  // Toplam Laptop Talebi: 50 + 30 + 20 + 20 = 120 Adet (Stok 70 olduğu için 50 adet karşılanamayacak)
  await prisma.storeDemand.createMany({
    data: [
      { storeId: sKanyon.id, productId: p1.id, requestedQuantity: 50 },
      { storeId: sKizilay.id, productId: p1.id, requestedQuantity: 30 },
      { storeId: sAlsancak.id, productId: p1.id, requestedQuantity: 20 },
      { storeId: sBursa.id, productId: p1.id, requestedQuantity: 20 },
      { storeId: sKanyon.id, productId: p2.id, requestedQuantity: 100 },
      { storeId: sAlsancak.id, productId: p3.id, requestedQuantity: 50 },
    ],
  });

  console.log("✅ Mock veriler SQLite veritabanına başarıyla yüklendi!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });