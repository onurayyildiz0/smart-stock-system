# 📦 Intelligent Stock Allocation & Supply Chain Optimization System

Merkezi depolar ile perakende mağazaları arasındaki ürün akışını, sevkiyat maliyetlerini ve teslimat sürelerini optimize eden **Akıllı Stok Dağıtım ve Tedarik Zinciri Optimizasyon Sistemi**.

Kısıtlı stok ortamında mağaza önceliklendirmesi (Store Tiering), çok kriterli depo skorlaması ve parçalı sevkiyat (Split Allocation) mantığını modern **Next.js 14+ (App Router)**, **TypeScript** ve **Prisma ORM** mimarisiyle uçtan uca çözer.

---

## ✨ Temel Özellikler

- **Multi-Criteria Greedy Allocation:** Kargo maliyeti (%70) ve teslimat süresi (%30) ağırlıklarıyla optimum rotayı belirleyen dinamik optimizasyon algoritması.
- **Store Tier Prioritization:** Kıtlık anında stoğu otomatik olarak yüksek öncelikli ($Tier\ 3 > Tier\ 2 > Tier\ 1$) Flagship mağazalara tahsis eden önceliklendirme mekanizması.
- **Split Fulfillment (Parçalı Sevkiyat):** Tek bir deponun talebi karşılayamadığı senaryolarda talebi birden fazla depoya en düşük toplam maliyetle paylaştırma yeteneği.
- **Shortage & Bottleneck Alerts:** Karşılanamayan talepleri mağaza önceliği ve eksik miktar kırılımıyla anlık raporlayan uyarı paneli.
- **Server Actions Architecture:** API katmanı yerine Next.js Server Actions kullanarak tip güvenli ve sıfır-CORS veri mutasyonu.
- **In-Memory State Execution:** Veritabanı I/O maliyetini minimize etmek için $O(1)$ erişimli `Map` yapıları üzerinde bellek içi stok yönetimi ve toplu işlem (batch/transaction) kaydı.

---

## 🏗️ Mimari ve Veri Akışı
[ Next.js React Server Components (UI) ]
│
▼ (Server Actions / RPC)
[ Allocation Engine (Multi-Criteria Heuristic) ]
│
▼ (Prisma ORM 5 - Singleton Client)
[ SQLite Database (dev.db / Relational Schema) ]


### İlişkisel Veri Modeli
- **Product (1) ──── (N) WarehouseStock (N) ──── (1) Warehouse**
- **Warehouse (1) ─── (N) WarehouseRoute (N) ──── (1) Store**
- **Store (1) ────── (N) StoreDemand (1) ────── (N) AllocationItem**
- **AllocationRun (1) ────────────────────────── (N) AllocationItem**

---

## 🧮 Algoritma & Zaman Karmaşıklığı

Algoritma `src/lib/allocation-engine.ts` altında saf TypeScript fonksiyonu olarak çalışır:

1. **Öncelik Sıralaması:** Mağazalar Tier derecelerine göre $O(D \log D)$ sürede sıralanır.
2. **Rota Maliyet Fonksiyonu:** Her talep için uygun depolara çok kriterli skor uygulanır:
   $$\text{Skor} = (\text{Birim Kargo Maliyeti} \times 0.7) + (\text{Teslimat Günü} \times 10 \times 0.3)$$
3. **Tahsis & Güncelleme:** $O(1)$ `Map` lookup ile stoklar eksiltilir ve parçalı sevkiyat planı çıkarılır.

**Toplam Zaman Karmaşıklığı:** $O(D \log D + D \cdot W \log W)$  
*(D: Talep Sayısı, W: Depo Sayısı)*

---

## 🛠️ Teknoloji Yığını

- **Framework:** Next.js 14+ (App Router, Server Actions)
- **Dil:** TypeScript (Strict Mode)
- **Veritabanı & ORM:** SQLite / Prisma ORM 5
- **Stil & İkon:** Tailwind CSS, Lucide React
- **Çalıştırma:** tsx (TypeScript Execute)

---

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleyin
```bash
npm install
npx prisma db push
npx prisma generate
npx tsx prisma/seed.ts
npm run dev
npx prisma studio