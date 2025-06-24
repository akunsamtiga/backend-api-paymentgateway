
# 💸 SanzyPay — Payment Gateway via NowPayments + Telegram Bot

SanzyPay adalah sistem gateway pembayaran kripto berbasis [NowPayments.io](https://nowpayments.io), terintegrasi dengan Bot Telegram dan backend Node.js tanpa autentikasi.

---

## 🚀 Fitur Utama

- ✅ Pembuatan invoice (web/telegram)
- ✅ Integrasi pembayaran kripto via NowPayments
- ✅ Webhook otomatis: update status + notifikasi Telegram + refill XSID
- ✅ Dashboard Admin (tanpa login)
- ✅ Riwayat transaksi publik
- ✅ Statistik transaksi
- ✅ Email notifikasi sukses
- ✅ Tanpa autentikasi — cocok untuk layanan publik/Telegram Bot

---

## 📦 Teknologi

- **Backend:** Express.js + MongoDB
- **Bot:** `node-telegram-bot-api`
- **Email:** Nodemailer (Gmail)
- **Webhook Signature:** HMAC SHA512 (NowPayments)
- **Rate Limiter:** express-rate-limit
- **Logger:** winston + daily-rotate

---

## ⚙️ Instalasi

1. Clone repo ini:

```bash
git clone https://github.com/namamu/sanzypay.git
cd sanzypay
````

2. Install dependencies:

```bash
npm install
```

3. Buat file `.env`:

```env
NOWPAYMENTS_API_KEY=xxx
MONGODB_URI=mongodb+srv://...
WEBHOOK_SECRET=...
EMAIL_USER=example@gmail.com
EMAIL_PASS=app-password
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_ID=123456789
XSID_API_URL=https://srxsnet.com/xs
BASE_URL=http://localhost:3000
```

4. Jalankan backend:

```bash
npm run dev
```

5. Jalankan bot:

```bash
node telegram/bot.js
```

---

## 🌐 API Endpoint

Semua endpoint bersifat **publik** dan **tidak memerlukan autentikasi**.

| Metode | Endpoint                       | Deskripsi                           |
| ------ | ------------------------------ | ----------------------------------- |
| POST   | `/api/payment/create`          | Buat invoice manual (via panel/web) |
| POST   | `/api/payment/telegram-create` | Buat invoice dari Telegram bot      |
| POST   | `/api/payment/webhook`         | Webhook dari NowPayments            |
| GET    | `/api/payment/history`         | Lihat riwayat transaksi             |
| GET    | `/api/payment/admin/stats`     | Statistik umum                      |
| GET    | `/api/payment/:invoice_id`     | Detail invoice                      |

> 📎 Dokumentasi lengkap endpoint ada di: `docs/api.md`

---

## 🤖 Telegram Bot

Bot menggunakan polling & mendukung:

* `/start` — sambutan
* `/bind xsid-xxx` — hubungkan Telegram ke akun XSID
* `/topup <nominal>` — buat invoice langsung via NowPayments

---

## 🔐 Webhook Signature (NowPayments)

Untuk keamanan, webhook divalidasi dengan `x-nowpayments-sig` (HMAC-SHA512).

Cek contoh uji coba signature manual:

```bash
node tesSignature/signature_finished.js
```

---

## 📊 Dashboard Admin

Frontend dashboard disediakan (tanpa login) untuk:

* Melihat statistik
* Membuat invoice
* Riwayat transaksi
* Lihat detail invoice

---

## 📁 Struktur Folder

```
.
├── app.js
├── telegram/
│   └── bot.js
├── routes/
├── controllers/
├── services/
├── utils/
├── models/
├── middleware/
├── docs/
│   └── api.md
├── tesSignature/
└── .env
```

---

## 📞 Kontak

Pengembang: **Sanzy ([sanzyxsid@gmail.com](mailto:sanzyxsid@gmail.com))**
Proyek freelance via Telegram: `@SanzyXSID`

---

## 📝 Lisensi

MIT License — bebas digunakan & dimodifikasi.
