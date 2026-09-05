// prisma/seed.ts
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed işlemi başlatılıyor...");

  // ─── 1. Temizlik (İlişki sıralamasına uygun silme) ───────────────
  await prisma.allocationItem.deleteMany();
  await prisma.allocationRun.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeDemand.deleteMany();
  await prisma.warehouseRoute.deleteMany();
  await prisma.warehouseStock.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.store.deleteMany();
  await prisma.product.deleteMany();

  console.log("🧹 Eski veriler temizlendi.");

  // ─── 2. Ürünler (Zorunlu price/maliyet eklendi) ──────────────────
  const laptop = await prisma.product.create({
    data: {
      sku: "PRD-001",
      name: "Laptop Pro 15",
      category: "Elektronik",
      price: 25000.0,
    },
  });

  const monitor = await prisma.product.create({
    data: {
      sku: "PRD-002",
      name: 'Monitör 27"',
      category: "Elektronik",
      price: 8500.0,
    },
  });

  const keyboard = await prisma.product.create({
    data: {
      sku: "PRD-003",
      name: "Mekanik Klavye",
      category: "Aksesuar",
      price: 1800.0,
    },
  });

  console.log("📦 Ürünler ve birim maliyetler oluşturuldu.");

  // ─── 3. Depolar ────────────────────────────────────────────────
  const warehouseIstanbul = await prisma.warehouse.create({
    data: {
      name: "İstanbul Merkez Depo",
      location: "İstanbul",
      capacity: 1000,
    },
  });

  const warehouseAnkara = await prisma.warehouse.create({
    data: {
      name: "Ankara Lojistik Depo",
      location: "Ankara",
      capacity: 800,
    },
  });

  const warehouseIzmir = await prisma.warehouse.create({
    data: {
      name: "İzmir Bölge Depo",
      location: "İzmir",
      capacity: 600,
    },
  });

  console.log("🏭 Depolar oluşturuldu.");

  // ─── 4. Depo Stokları ──────────────────────────────────────────
  await prisma.warehouseStock.createMany({
    data: [
      // İstanbul Depo (Toplam Laptop: 50, Monitör: 80, Klavye: 200)
      { warehouseId: warehouseIstanbul.id, productId: laptop.id, quantity: 50 },
      {
        warehouseId: warehouseIstanbul.id,
        productId: monitor.id,
        quantity: 80,
      },
      {
        warehouseId: warehouseIstanbul.id,
        productId: keyboard.id,
        quantity: 200,
      },

      // Ankara Depo (Toplam Laptop: 30, Monitör: 60, Klavye: 150)
      { warehouseId: warehouseAnkara.id, productId: laptop.id, quantity: 30 },
      { warehouseId: warehouseAnkara.id, productId: monitor.id, quantity: 60 },
      {
        warehouseId: warehouseAnkara.id,
        productId: keyboard.id,
        quantity: 150,
      },

      // İzmir Depo (Toplam Laptop: 20, Monitör: 40, Klavye: 100)
      { warehouseId: warehouseIzmir.id, productId: laptop.id, quantity: 20 },
      { warehouseId: warehouseIzmir.id, productId: monitor.id, quantity: 40 },
      { warehouseId: warehouseIzmir.id, productId: keyboard.id, quantity: 100 },
    ],
  });

  console.log("📊 Stoklar oluşturuldu.");

  // ─── 5. Mağazalar ──────────────────────────────────────────────
  const storeBursa = await prisma.store.create({
    data: {
      name: "Bursa AVM Mağazası",
      location: "Bursa",
      priority: 3, // Yüksek
    },
  });

  const storeAntalya = await prisma.store.create({
    data: {
      name: "Antalya Şubesi",
      location: "Antalya",
      priority: 2, // Orta
    },
  });

  const storeTrabzon = await prisma.store.create({
    data: {
      name: "Trabzon Şubesi",
      location: "Trabzon",
      priority: 1, // Düşük
    },
  });

  const storeKonya = await prisma.store.create({
    data: {
      name: "Konya Şubesi",
      location: "Konya",
      priority: 2, // Orta
    },
  });

  console.log("🏪 Mağazalar oluşturuldu.");

  // ─── 6. Rota, Maliyet & Depo Öncelik Bilgileri ───────────────────
  await prisma.warehouseRoute.createMany({
    data: [
      // İstanbul → Mağazalar
      {
        warehouseId: warehouseIstanbul.id,
        storeId: storeBursa.id,
        shippingCost: 12.0,
        deliveryDays: 1,
        priority: 3,
      },
      {
        warehouseId: warehouseIstanbul.id,
        storeId: storeAntalya.id,
        shippingCost: 25.0,
        deliveryDays: 3,
        priority: 2,
      },
      {
        warehouseId: warehouseIstanbul.id,
        storeId: storeTrabzon.id,
        shippingCost: 30.0,
        deliveryDays: 4,
        priority: 1,
      },
      {
        warehouseId: warehouseIstanbul.id,
        storeId: storeKonya.id,
        shippingCost: 20.0,
        deliveryDays: 2,
        priority: 2,
      },

      // Ankara → Mağazalar
      {
        warehouseId: warehouseAnkara.id,
        storeId: storeBursa.id,
        shippingCost: 18.0,
        deliveryDays: 2,
        priority: 2,
      },
      {
        warehouseId: warehouseAnkara.id,
        storeId: storeAntalya.id,
        shippingCost: 22.0,
        deliveryDays: 2,
        priority: 2,
      },
      {
        warehouseId: warehouseAnkara.id,
        storeId: storeTrabzon.id,
        shippingCost: 20.0,
        deliveryDays: 2,
        priority: 3,
      },
      {
        warehouseId: warehouseAnkara.id,
        storeId: storeKonya.id,
        shippingCost: 10.0,
        deliveryDays: 1,
        priority: 4,
      },

      // İzmir → Mağazalar
      {
        warehouseId: warehouseIzmir.id,
        storeId: storeBursa.id,
        shippingCost: 15.0,
        deliveryDays: 2,
        priority: 3,
      },
      {
        warehouseId: warehouseIzmir.id,
        storeId: storeAntalya.id,
        shippingCost: 18.0,
        deliveryDays: 1,
        priority: 3,
      },
      {
        warehouseId: warehouseIzmir.id,
        storeId: storeTrabzon.id,
        shippingCost: 40.0,
        deliveryDays: 5,
        priority: 1,
      },
      {
        warehouseId: warehouseIzmir.id,
        storeId: storeKonya.id,
        shippingCost: 16.0,
        deliveryDays: 2,
        priority: 2,
      },
    ],
  });

  console.log("🗺️  Rotalar ve öncelikler oluşturuldu.");

  // ─── 7. Bekleyen Mağaza Talepleri ──────────────────────────────
  await prisma.storeDemand.createMany({
    data: [
      // Bursa
      {
        storeId: storeBursa.id,
        productId: laptop.id,
        requestedQuantity: 60,
        status: "PENDING",
      },
      {
        storeId: storeBursa.id,
        productId: monitor.id,
        requestedQuantity: 50,
        status: "PENDING",
      },

      // Antalya
      {
        storeId: storeAntalya.id,
        productId: laptop.id,
        requestedQuantity: 30,
        status: "PENDING",
      },
      {
        storeId: storeAntalya.id,
        productId: keyboard.id,
        requestedQuantity: 200,
        status: "PENDING",
      },

      // Trabzon
      {
        storeId: storeTrabzon.id,
        productId: laptop.id,
        requestedQuantity: 25,
        status: "PENDING",
      },
      {
        storeId: storeTrabzon.id,
        productId: monitor.id,
        requestedQuantity: 80,
        status: "PENDING",
      },

      // Konya
      {
        storeId: storeKonya.id,
        productId: keyboard.id,
        requestedQuantity: 180,
        status: "PENDING",
      },
      {
        storeId: storeKonya.id,
        productId: monitor.id,
        requestedQuantity: 60,
        status: "PENDING",
      },
    ],
  });

  console.log("📋 Talepler oluşturuldu.");

  // ─── 8. Kullanıcı Hesapları (Şifre: 123456) ─────────────────────
  const defaultPassword = await bcrypt.hash("123456", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Sistem Yöneticisi",
        email: "admin@system.com",
        password: defaultPassword,
        role: "ADMIN",
        isApproved: true,
      },
      {
        name: "Bursa Mağaza Müdürü",
        email: "magaza@system.com",
        password: defaultPassword,
        role: "STORE_MANAGER",
        storeId: storeBursa.id,
        isApproved: true,
      },
      {
        name: "İstanbul Depo Sorumlusu",
        email: "depo@system.com",
        password: defaultPassword,
        role: "WAREHOUSE_MANAGER",
        warehouseId: warehouseIstanbul.id,
        isApproved: true,
      },
      {
        name: "İzmir Depo Adayı",
        email: "onaybekleyen@system.com",
        password: defaultPassword,
        role: "WAREHOUSE_MANAGER",
        warehouseId: warehouseIzmir.id,
        isApproved: false,
      },
    ],
  });

  console.log("👤 Roller ve kullanıcılar oluşturuldu.");
  console.log("✅ Seed başarıyla tamamlandı!");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
