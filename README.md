# Luma — Dashboard Keterbukaan Fasilitas & Infrastruktur Publik DKI Jakarta

> **Deskripsi Singkat:**  
> Luma (*Local Urban Mapping and Analytics*) adalah platform dashboard peta interaktif berbasis data terbuka resmi DKI Jakarta untuk memantau sebaran fasilitas publik (Pendidikan, Kesehatan, RTH), infrastruktur kota (Transportasi BRT & Jaringan Pipa Air Bersih PAM JAYA), serta kualitas udara (ISPU/AQI) secara real-time, transparan, dan akuntabel.

---

## 🗺️ Flow Aplikasi (User Journey)

Aplikasi Luma dirancang dengan dua alur eksplorasi terintegrasi:

```mermaid
flowchart TD
    subgraph Alur1["Alur 1: Eksplorasi Kondisi Wilayah"]
        A1(["Mulai"]) --> B1["Buka situs web Luma"]
        B1 --> C1["Lihat dashboard default DKI Jakarta"]
        C1 --> D1["Pilih wilayah administratif Kota/Kabupaten"]
        D1 --> E1{"Data tingkat kecamatan tersedia?"}
        E1 -- "Ya" --> F1["Pilih kecamatan (opsional)"]
        E1 -- "Tidak, tetap tingkat kota" --> G1["Lihat indikator dan insight wilayah"]
        F1 --> G1
        G1 --> H1["Jelajahi kategori: Air, Udara, Faskes, RTH, Sekolah, Transum"]
        H1 --> I1["Tinjau nilai indikator, satuan, dan periode data"]
        I1 --> J1["Akses informasi sumber data resmi"]
        J1 --> K1{"Jelajahi kategori lain?"}
        K1 -- "Ya" --> H1
        K1 -- "Tidak" --> L1(["Selesai"])
    end

    subgraph Alur2["Alur 2: Eksplorasi Fasilitas Publik"]
        A2(["Mulai"]) --> B2["Buka peta interaktif"]
        B2 --> C2["Pilih / filter kategori fasilitas"]
        C2 --> D2["Jelajahi marker fasilitas & cluster berbentuk lingkaran"]
        D2 --> E2["Perbesar (zoom) area tertentu"]
        E2 --> F2["Pilih marker fasilitas individual"]
        F2 --> G2["Lihat detail fasilitas & informasi transparansi data"]
        G2 --> H2{"Jelajahi fasilitas lain?"}
        H2 -- "Ya" --> C2
        H2 -- "Tidak" --> I2(["Selesai"])
    end
```

### Format Ringkasan Linear (Alur Terpadu)
```text
User buka web Luma -> Dashboard Peta DKI -> Pilih Wilayah Kota/Kabupaten -> Tinjau Indikator (ISPU Udara, Air, Faskes, RTH, Pendidikan, Transum) -> Filter Kategori Fasilitas -> Eksplorasi Marker/Cluster Peta -> Buka Detail Fasilitas (Anggaran APBD, Legalitas Izin, Mutu Lingkungan) -> Akses Katalog Sumber Data Resmi.
```

---

## 🏛️ Arsitektur Informasi & Fitur

Struktur hierarki fitur dalam platform Luma:

```
Luma
├── Dashboard Utama
│   ├── Indikator dan Insight Wilayah
│   │   ├── Kualitas Air (Cakupan jaringan pipa PAM JAYA 68%)
│   │   ├── Kualitas Udara (ISPU/AQI live SPKU Dinas Lingkungan Hidup)
│   │   ├── Pendidikan (1.503 Satuan Pendidikan Negeri SD/SMP/SMA/SMK)
│   │   ├── Kesehatan (51 RSUD dan Puskesmas Kecamatan)
│   │   ├── Ruang Terbuka Hijau (418 Taman dan Hutan Kota)
│   │   └── Transportasi Publik (13 Koridor Utama BRT Transjakarta)
│   ├── Peta Interaktif (MapLibre GL Vector Engine)
│   │   ├── Batas Wilayah Administratif (Provinsi DKI & 6 Kota/Kabupaten)
│   │   ├── Marker Fasilitas Publik (Pin spesifik per kategori)
│   │   ├── Proximity Clustering (Cluster lingkaran dengan counter & rincian)
│   │   └── Kontrol Peta (Zoom in/out, reset pandangan, 3 mode tema peta)
│   ├── Pemilihan Wilayah
│   │   ├── Kota/Kabupaten Administratif (Pusat, Utara, Barat, Selatan, Timur, Kep. Seribu)
│   │   └── Informasi Tingkat Kecamatan (Sesuai ketersediaan data)
│   └── Detail Fasilitas (Side Glass Modal)
│       ├── Identitas Fasilitas (Nama, kategori, jenjang, alamat lengkap, koordinat GPS)
│       ├── Transparansi Realisasi Anggaran (Alokasi BOS/BOP/APBD, tahun anggaran, pelaksana)
│       ├── Kondisi Lingkungan Sekitar (AQI lokal, walkability index, akses halte transit)
│       └── Legalitas Izin & Dokumen (Status PBG, SLF, SPPL)
└── Transparansi Sumber Data
    ├── Sumber Dataset Resmi (Satu Data Jakarta, Kemendikbud, DLH, PAM JAYA, Dinkes, Distamhut)
    ├── Periode Pembaruan Data & Metodologi Pipeline
    └── Keterbatasan Data & Catatan Akurasi
```

---

## 🛠️ Tech Stack

Platform Luma dikembangkan menggunakan arsitektur **Monorepo** (*npm workspaces*) dengan pemisahan aplikasi frontend dan backend yang terstruktur:

### Frontend (`apps/web`)
- **Core Framework:** React 19, TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS v4, Modern Frosted Glassmorphism (`.luma-glass`), Theme Tokens
- **Peta & GIS:** MapLibre GL (Vector & Raster Canvas, GeoJSON Poligon & Marker)
- **Visualisasi Data:** ApexCharts & React-ApexCharts
- **Linter & Code Quality:** ESLint 10, TypeScript-ESLint

### Backend API (`apps/api`)
- **Runtime & Server:** Node.js, Express.js, TypeScript
- **Database ORM:** Drizzle ORM, Drizzle Kit
- **Database Driver:** PostgreSQL (`pg`)
- **Development Tooling:** `tsx` (TypeScript Execution Engine)
- **Security & Middleware:** Helmet, CORS, Express-Rate-Limit, Compression

---

## 🚀 Cara Menjalankan Project (Getting Started)

Ikuti langkah-langkah berikut untuk mengunduh, memasang dependensi, dan menjalankan project di lingkungan lokal:

### 1. Clone Repository
```bash
git clone https://github.com/ltnzz/luma.git
cd Luma
```

### 2. Install Dependencies
Jalankan perintah instalasi dependensi dari direktori utama (*root*) project:
```bash
npm install
```

### 3. Menjalankan Aplikasi

#### Menjalankan Frontend (Web Dashboard)
```bash
npm --prefix apps/web run dev
```
Aplikasi web akan berjalan pada: `http://localhost:5173`

#### Menjalankan Backend API (Opsional untuk integrasi server)
```bash
npm --prefix apps/api run dev
```
Server API backend akan berjalan pada: `http://localhost:3000`

#### Membangun Project untuk Produksi (*Production Build*)
```bash
npm --prefix apps/web run build
```

#### Menjalankan Linting
```bash
npm --prefix apps/web run lint
```

---

## 📌 Fitur Unggulan

1. **Dashboard Peta Interaktif Dua Layer (*Hierarchical GIS Canvas*)**:
   - **Layer 1 (Provinsi):** Agregat sebaran fasilitas per kota administratif DKI Jakarta terintegrasi status kualitas udara real-time SPKU.
   - **Layer 2 (Per-Kota):** Sebaran mikro titik fasilitas dengan algoritma *proximity clustering* anti-tabrakan pin (*zero collision*) dan kartu pratinjau instan (*quick preview tooltip*).

2. **Arsitektur Filter Dinamis Terpadu (*Solo-Focus Map Layering*)**:
   - Kontrol filter utama melalui dock horizontal bawah (*KpiMetricsDock*).
   - Mode Solo-Focus otomatis menyembunyikan titik layer lain agar visual peta fokus dan jernih.
   - Sub-filter jenjang sekolah (SD/SMP/SMA), faskes (RSUD/Puskesmas), dan RTH (Taman/Hutan Kota).

3. **Infrastruktur & Jaringan Layanan Publik DKI Jakarta**:
   - **Jaringan BRT Transjakarta:** Visualisasi 13 koridor utama, penelusuran rute dan halte transit, serta integrasi jarak halte ke fasilitas.
   - **Jaringan Pipa Air Bersih PAM JAYA:** Visualisasi jalur pipa distribusi air minum perpipaan dan stasiun Instalasi Pengolahan Air (IPA).
   - **Fasilitas Kesehatan Terverifikasi:** 51 RSUD dan Puskesmas Kecamatan resmi Dinas Kesehatan DKI Jakarta.
   - **Sekolah Negeri Terakreditasi:** 1.503 Satuan Pendidikan Negeri (SD, SMP, SMA, SMK, SLB) terintegrasi data Dapodik Kemendikbud.
   - **Ruang Terbuka Hijau:** 418 Taman dan Hutan Kota resmi Distamhut DKI Jakarta.

4. **Monitoring Kualitas Udara Real-Time (ISPU / AQI)**:
   - Skala kesehatan udara 6 tingkatan terkoneksi sensor SPKU Dinas Lingkungan Hidup DKI Jakarta.
   - Indikator meteran warna visual, status level kesehatan, dan panduan mitigasi kesehatan warga.

5. **Side Glass Modal & Transparansi Anggaran**:
   - Panel detail fasilitas ramping di sebelah kanan dengan efek frosted glassmorphism modern tanpa menutupi kontrol peta atau dock bawah.
   - Menampilkan transparansi anggaran pembangunan/operasional (APBD/BOS/BOP), legalitas izin (PBG, SLF, SPPL), skor walkability, dan koordinat GPS presisi.

6. **Transparansi & Provenansi Data Publik**:
   - Katalog sumber data terverifikasi (Satu Data Jakarta, Kemendikbud, DLH DKI, PAM JAYA, Dinkes, Distamhut).
   - Informasi pembaruan berkala dan transparansi metodologi agregasi data geospasial.
