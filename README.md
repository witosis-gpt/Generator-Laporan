# Penyusun Draft Laporan Kegiatan

Aplikasi web untuk menyusun draft laporan kegiatan/nota dinas secara otomatis
dari transkrip rapat, mengikuti format template instansi. Menggunakan Claude API
(Anthropic) di sisi server — API key tidak pernah terekspos ke browser.

## Struktur Project

```
laporan-generator-app/
├── index.html                        # Frontend (vanilla HTML/CSS/JS, tanpa build step)
├── api/
│   └── generate-report.js            # Serverless function untuk Vercel
├── netlify/
│   └── functions/
│       └── generate-report.js        # Serverless function untuk Netlify
├── netlify.toml                      # Config redirect khusus Netlify
└── package.json
```

Anda hanya perlu **salah satu** — Vercel atau Netlify — sesuai platform pilihan.
Tidak perlu menghapus folder yang tidak dipakai, tidak akan mengganggu.

## 1. Dapatkan API Key

1. Buka [console.anthropic.com](https://console.anthropic.com) dan buat akun
   (ini akun developer/billing, berbeda dari akun Claude.ai biasa).
2. Isi saldo (mulai dari sekitar $5, sistemnya pay-as-you-go).
3. Masuk ke menu **API Keys**, buat key baru, salin nilainya
   (formatnya `sk-ant-...`). Simpan baik-baik, tidak akan ditampilkan lagi.

## 2. Deploy ke Vercel

1. Push folder ini ke repository GitHub (bisa **private repo**, tidak masalah).
2. Buka [vercel.com](https://vercel.com), klik **New Project**, pilih repo tadi.
3. Sebelum deploy, buka **Environment Variables**, tambahkan:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (API key dari langkah 1)
4. Klik **Deploy**. Selesai — Anda dapat URL seperti `nama-project.vercel.app`.

## 2b. Atau Deploy ke Netlify

1. Push folder ini ke GitHub.
2. Buka [app.netlify.com](https://app.netlify.com), **Add new site → Import an existing project**.
3. Di **Site settings → Environment variables**, tambahkan `ANTHROPIC_API_KEY` seperti di atas.
4. Deploy. Netlify otomatis mendeteksi `netlify.toml` dan folder `netlify/functions`.

## 3. Custom Domain (opsional)

Baik Vercel maupun Netlify punya menu **Domains** di dashboard project —
tinggal arahkan domain instansi (mis. `laporan.namainstansi.go.id`) ke sana
lewat CNAME/A record sesuai instruksi yang mereka tampilkan.

## Estimasi Biaya

Model default: `claude-sonnet-5`. Biaya dihitung per token (teks masuk + keluar):
- Transkrip pendek (~30 menit rapat): kira-kira Rp500–1.500 per generate
- Transkrip panjang (rapat berjam-jam): kira-kira Rp3.000–8.000 per generate

Untuk volume tinggi dan mau lebih hemat, ganti `model: 'claude-sonnet-5'` jadi
`model: 'claude-haiku-4-5-20251001'` di `api/generate-report.js` (dan versi Netlify-nya) —
lebih murah, kualitas sedikit lebih sederhana.

Pantau pemakaian real-time di **console.anthropic.com → Usage**.

## Keamanan

- API key hanya hidup di environment variable server, tidak pernah dikirim ke browser.
- Belum ada autentikasi user di versi ini — siapa pun yang tahu URL-nya bisa generate
  laporan (dan memakai kuota/biaya Anda). Kalau mau dibatasi hanya untuk pegawai
  instansi, tambahkan langkah login sederhana (misal password bersama, atau SSO)
  sebelum form bisa dipakai — bisa saya bantu tambahkan kalau diperlukan.
