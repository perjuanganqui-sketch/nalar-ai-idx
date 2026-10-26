# Nalar — Analisis Saham Indonesia

Terminal analisis saham IDX dengan watchlist, chart candlestick, panel quote, indikator teknikal, alat anotasi chart, dan Nalar AI. Aplikasi ini tidak menyediakan fitur transaksi.

## Menjalankan aplikasi

Pastikan Node.js dan dependensi proyek sudah tersedia. Atur `GEMINI_API_KEY` di file `.env` pada direktori utama proyek. Untuk menjalankan aplikasi tanpa Vite dev server, build frontend sekali lalu jalankan server:

```sh
npm run build
npm start
```

Buka `http://nalar.localhost:3001` (atau `http://localhost:3001`). Server menyajikan frontend hasil build dan API pasar/AI pada alamat yang sama. Untuk mode pengembangan, jalankan `npm run dev` dari direktori `local-ai`; Vite meneruskan request API ke backend.

Di Windows, `start-nalar.vbs` dapat dipasang ke folder Startup agar frontend dan backend berjalan otomatis saat login. Log server disimpan di `%LOCALAPPDATA%\Nalar\server.log`.

## Deploy online di Vercel

Repository ini memakai `vercel.json` untuk menggabungkan frontend Vite dan backend Express dalam satu domain: request `/api/*` menuju backend, sedangkan halaman lainnya menuju frontend. Hubungkan repository GitHub ke Vercel dan deploy sebagai project multi-service. Tambahkan `GEMINI_API_KEY` sebagai environment variable rahasia pada pengaturan project Vercel; jangan simpan API key di repository. Vercel Hobby ditujukan untuk penggunaan personal/non-komersial. Jika project digunakan secara komersial, pilih paket yang sesuai dengan ketentuan Vercel.

Untuk alternatif Render, `render.yaml` tetap tersedia. Layanan gratis dapat tidur saat tidak digunakan, dan Render mungkin meminta metode pembayaran untuk verifikasi akun. Penggunaan Gemini tetap mengikuti kuota project Google yang terkait dengan API key.

## Sumber dan keterlambatan data

- Aplikasi mengambil IHSG (`^JKSE`) dan kuotasi watchlist pilihan dari endpoint grafik Yahoo Finance, lalu memeriksa pembaruan setiap 30 detik. Cari ticker atau nama emiten lain untuk menemukan dan menambahkannya ke watchlist; grafik dan kuotasi emiten tersebut dimuat saat dipilih agar tidak meminta data semua saham sekaligus. Interval polling bukan jaminan penyedia menerbitkan harga baru setiap 30 detik.
- Gunakan tombol `−`/`+` untuk menghapus atau menambahkan ticker terpilih ke watchlist, tombol bintang untuk mengatur favorit, dan filter watchlist untuk menampilkan favorit. Perubahan ini berlaku selama halaman terbuka.
- Tombol perbarui mengambil data lagi tanpa memuat ulang halaman.
- Logo lokal ditampilkan untuk ticker yang memiliki aset logo; ticker lainnya memakai monogram berwarna yang dibuat dari kode saham.
- Pilih ticker di watchlist untuk melihat candlestick, volume, RSI, dan moving average dengan periode 1D, 5D, 1M, 3M, 6M, 1Y, 5Y, atau seluruh histori.
- Gunakan alat Trendline (pilih dua titik) atau Garis harga (pilih satu titik) untuk menambahkan anotasi manual pada chart. Undo dan Hapus gambar hanya memengaruhi anotasi ticker yang sedang dipilih; anotasi tersimpan selama halaman tetap terbuka.
- Sinyal teknikal AI untuk ticker terpilih diperbarui setiap 30 detik menggunakan Gemini 3.6 Flash dan candle Yahoo Finance 5 menit dari beberapa hari terakhir. Analisis multi-indikator membantu mengurangi WAIT yang tidak perlu, tetapi WAIT tetap mungkin saat indikator berimbang atau bertentangan. Panah AI BUY/SELL tampil pada candle terbaru; status WAIT tidak menampilkan panah. Ini klasifikasi edukasi, bukan feed real-time terjamin atau rekomendasi investasi personal, dan tidak menjamin akurasi maupun hasil.
- Panel Nalar AI menerima konteks ticker terpilih dan kuotasi terakhir yang tersedia.
- Tidak ada tombol beli/jual atau order book. Aplikasi ini khusus untuk analisis dan tidak terhubung ke broker.
- Endpoint tersebut bukan API resmi Bursa Efek Indonesia dan tidak menjamin harga real-time, kelengkapan, ketersediaan, atau SLA. Data dapat tertunda, berubah format, atau berhenti tersedia.
- Untuk kuotasi real-time resmi, gunakan feed/API dari penyedia berlisensi atau broker yang mengizinkan distribusi data dan sediakan kredensial/API key. Integrasi saat ini belum memakai feed berlisensi.
- Data pasar dan analisis AI adalah informasi edukasi, bukan rekomendasi personal untuk membeli atau menjual saham. Verifikasi informasi pada sumber resmi seperti BEI, OJK, dan laporan emiten.
