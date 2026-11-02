# KasirKu

Prototipe aplikasi kasir mobile React Native dengan Expo. Aplikasi menyediakan login Admin/Kasir, dashboard, pencarian produk, pengelolaan katalog untuk Admin, transaksi, produk unggulan, pengelolaan pengguna, dan profil.

## Menjalankan aplikasi

```powershell
npm install
npm start
```

Pindai QR code menggunakan Expo Go, atau jalankan `npm run android` saat emulator Android tersedia.

## Akun demo

| Peran | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Kasir | `kasir` | `kasir123` |

Admin dapat membuat akun tambahan melalui menu **Kelola Pengguna**.

## Hak akses

- **Admin:** mengelola produk dan akun, membuat transaksi, melihat/menghapus transaksi.
- **Kasir:** mencari dan melihat produk, membuat transaksi, serta melihat riwayat. Kasir tidak dapat menambah, mengubah, atau menghapus produk, mengubah stok secara manual, maupun menghapus transaksi.
- Ketika transaksi Admin dihapus, jumlah produk yang terjual dikembalikan ke stok.

Produk demo dapat diedit atau dihapus melalui menu **Kelola Produk**. Data produk, akun, dan transaksi disimpan lokal pada perangkat menggunakan AsyncStorage. Transaksi merupakan simulasi sederhana dan belum terhubung dengan pembayaran sungguhan atau backend.

## Catatan keamanan

Aplikasi ini ditujukan untuk demonstrasi akademik. Akun demo dan data disimpan lokal; password belum di-hash dan tidak ada autentikasi server. Jangan gunakan dengan data atau kredensial produksi sebelum menambahkan backend, autentikasi yang aman, dan otorisasi server.

Pemeriksaan `npm audit --omit=dev` juga melaporkan advisori tingkat tinggi pada dependency transitif Expo CLI (`node-forge` dan `zod`). Perbaikan otomatis yang ditawarkan npm meminta downgrade Expo yang memutus kompatibilitas SDK, jadi tidak diterapkan; periksa kembali advisori saat pembaruan kompatibel tersedia.
