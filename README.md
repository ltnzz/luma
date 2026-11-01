# Luma — Dashboard Keterbukaan Fasilitas & Infrastruktur Publik DKI Jakarta

> **Deskripsi Singkat:**  
> Luma adalah platform dashboard peta interaktif berbasis data terbuka resmi DKI Jakarta untuk memantau sebaran fasilitas publik (Pendidikan, Kesehatan, RTH), infrastruktur kota (Transportasi BRT & Jaringan Pipa Air Bersih PAM JAYA), serta kualitas udara (ISPU/AQI) secara real-time dan transparan.

---

## 🛠️ Tech Stack

Platform Luma dikembangkan menggunakan arsitektur **Monorepo** (*npm workspaces*) dengan pemisahan aplikasi frontend dan backend yang terstruktur:

### Frontend (`apps/web`)
- **Core Framework:** React 19, TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS v4, Modern Glassmorphism & Token Theme
- **Peta & GIS:** MapLibre GL (Vector & Raster Map Canvas, GeoJSON)
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
git clone https://github.com/<username>/<repo-name>.git
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

---

## 📌 Progress Saat Ini

Berikut adalah status pencapaian fitur yang telah berhasil diimplementasikan:

1. **Dashboard Peta Interaktif Dua Layer (*Hierarchical GIS Map Canvas*)**:
   - **Layer 1 (Makro Provinsi):** Visualisasi sebaran agregat fasilitas per-kota administrasi DKI Jakarta (5 Kota Administrasi + Kab. Kepulauan Seribu) terintegrasi langsung dengan skor dan indikator kualitas udara real-time SPKU.
   - **Layer 2 (Mikro Wilayah):** Peta titik sebaran fasilitas publik dengan algoritma *proximity clustering* anti-tabrakan pin (*zero collision*) dan kartu pratinjau instan (*facility quick preview tooltip*).

2. **Integrasi Fasilitas Layanan Publik Resmi**:
   - **Fasilitas Kesehatan (Faskes Primer):** 51 RSUD dan Puskesmas Kecamatan terakreditasi resmi Dinas Kesehatan DKI Jakarta.
   - **Ruang Terbuka Hijau (RTH):** 418 Taman dan Hutan Kota dengan klasifikasi sub-kategori.
   - **Sekolah Negeri Terverifikasi:** 1.503 Satuan Pendidikan Negeri (SD, SMP, SMA, SMK, SLB) terintegrasi data Dapodik Kemendikbudristek.

3. **Infrastruktur & Jaringan Layanan Kota**:
   - **Jaringan BRT Transjakarta:** Visualisasi 13 koridor utama Transjakarta, deduplikasi halte transit/interchange, serta panel penelusuran rute dan halte.
   - **Jaringan Air Bersih (PAM JAYA):** Visualisasi jalur pipa transmisi/distribusi air minum perpipaan, stasiun Instalasi Pengolahan Air (IPA Pejompongan, Buaran, Pulogadung, Cilandak, Penjaringan), dan metrik keterlayanan 68% warga.

4. **Monitoring Kualitas Udara (ISPU/AQI) Terkoneksi Real-Time**:
   - Skala kesehatan udara 6 tingkatan (Baik, Sedang, Sensitif, Tidak Sehat, Sangat Tidak Sehat, Berbahaya).
   - Meteran kesehatan visual tersegmentasi (*segmented gauge meter*), badge peringatan, dan panduan dampak kesehatan bagi warga.

5. **Transparansi & Provenansi Data Publik**:
   - Komponen katalog Sumber Data Resmi terverifikasi (Satu Data DKI, Dapodik, DLH, PAM JAYA, Dinkes, Distamhut).
   - Modal Audit Transparansi Anggaran & Fasilitas (rincian APBD, riwayat pengadaan, kontraktor pelaksana, dan dokumen spesifikasi).
