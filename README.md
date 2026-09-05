# 📦 Intelligent Stock Allocation & Supply Chain Optimization System

Merkezi depolar ile perakende mağazaları arasındaki ürün akışını, sevkiyat maliyetlerini ve teslimat sürelerini optimize eden **Akıllı Stok Dağıtım ve Tedarik Zinciri Optimizasyon Sistemi**.

Kısıtlı stok ortamında mağaza önceliklendirmesi (Store Tiering), deterministik FIFO eşitlik çözümü, çok kriterli rota skorlaması ve parçalı sevkiyat (Split Allocation) mantığını modern **Next.js 16 (App Router)**, **TypeScript** ve **Prisma ORM** mimarisiyle uçtan uca çözer.

---

## ✨ Temel Özellikler

- **Multi-Criteria Greedy Allocation:** Kargo maliyeti (%70) ve teslimat süresi (%30) ağırlıklarıyla optimum rotayı belirleyen dinamik optimizasyon algoritması.
- **Store Tier Prioritization & Deterministic FIFO:** Kıtlık anında stoğu önce yüksek öncelikli mağazalara ($Tier\ 3 > Tier\ 2 > Tier\ 1$), eşitlik halinde ise talep oluşturulma tarihine (`createdAt` FIFO) göre deterministik olarak tahsis eder.
- **Split Fulfillment (Parçalı Sevkiyat):** Tek bir deponun talebi karşılayamadığı senaryolarda talebi birden fazla depoya en düşük toplam maliyetle paylaştırma yeteneği (`PARTIAL` & `FULFILLED` durum yönetimi).
- **Physical Warehouse Capacity Enforcement:** Depo kapasitelerini (`capacity`) hem stok ekleme hem de miktar güncelleme anında denetleyerek fiziksel taşmaları engelleyen koruma mekanizması.
- **Atomic Transaction & Concurrency Safety:** `prisma.$transaction` ve anlık bakiye denetimi sayesinde eş zamanlı dağıtımlarda stokların negatife düşmesini engelleyen veri tutarlılığı.
- **Role-Based Access Control (RBAC):** Admin, Depo Müdürü (`WAREHOUSE_MANAGER`) ve Mağaza Müdürü (`STORE_MANAGER`) rolleriyle izole edilmiş yetkilendirme ve veri filtreleme katmanı.
- **Consistent KPI Dashboards:** Tamamlanmış talepleri bekleyen siparişlerden ayıran ve kullanıcı rolüne göre tutarlı metrikler üreten anlık analitik paneli.
- **In-Memory State Execution:** Veritabanı I/O maliyetini minimize etmek için $O(1)$ erişimli `Map` yapıları üzerinde bellek içi stok yönetimi ve toplu işlem kaydı.

---

## 🏗️ Mimari ve Veri Akışı

```text
[ Next.js React Server Components & UI Modals ]
                      │
                      ▼ (Server Actions / Mutex & RBAC)
[ Allocation Engine (Multi-Criteria Heuristic & FIFO) ]
                      │
                      ▼ (Prisma ORM Transaction / Atomicity)
       [ SQLite Database (dev.db / Relational Schema) ]
```

İlişkisel Veri Modeli
Product (1) ──── (N) WarehouseStock (N) ──── (1) Warehouse

Warehouse (1) ─── (N) WarehouseRoute (N) ──── (1) Store

Store (1) ────── (N) StoreDemand (1) ────── (N) AllocationItem

AllocationRun (1) ────────────────────────── (N) AllocationItem

User (N) ─────── (1) Store / Warehouse (RBAC)

🧮 Algoritma & Zaman KarmaşıklığıAlgoritma src/lib/allocation-engine.ts altında saf TypeScript fonksiyonu olarak çalışır:

1. Öncelik ve FIFO Sıralaması: Mağazalar önce Tier derecelerine (priority desc), eşitlik durumunda ise oluşturulma tarihine (createdAt asc) göre sıralanır: $O(D \log D)$

2. Rota Maliyet Fonksiyonu: Her talep için uygun depolara çok kriterli skor uygulanır:$$\text{Skor} = (\text{Birim Kargo Maliyeti} \times 0.7) + (\text{Teslimat Günü} \times 10 \times 0.3)$$

3. Tahsis & Güncelleme: $O(1)$ Map lookup ile stoklar eksiltilir, karşılanamayanlar için kıtlık raporu oluşturulur.

Toplam Zaman Karmaşıklığı: $O(D \log D + D \cdot W \log W)$
(D: Talep Sayısı, W: Depo Sayısı)

🛠️ Teknoloji Yığını

- Framework: Next.js 16 (App Router, Server Actions, Turbopack)
- Dil: TypeScript (Strict Mode)
- Veritabanı & ORM: SQLite / Prisma ORM
- Yetkilendirme: NextAuth.js (Credentials Provider, RBAC)
- Test Altyapısı: Node.js Native Test Runner (node:test, node:assert) & tsx
- Stil: Tailwind CSS, Lucide React

🚀 Kurulum ve Çalıştırma

1. Bağımlılıkları Yükleyin

```bash
npm install
```

2. Veritabanını Hazırlayın ve Başlangıç Verilerini Yükleyin

```bash
npx prisma db push
npx prisma generate
npx prisma db seed
```

3. Birim Testleri Çalıştırın
   Algoritmanın kıt stok önceliğini, FIFO tie-breaking mantığını ve rota seçimini doğrulamak için:

```bash
npm test
```

4. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

5. Production Derlemesi

```bash
npm run build
npm run start
```

6. Veritabanı Arayüzü (İsteğe Bağlı)

```bash
npx prisma studio
```
