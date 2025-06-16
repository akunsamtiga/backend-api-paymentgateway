Tentu, Sanzy! Berikut adalah **dokumentasi lengkap** (`README.md`) proyek pembayaran crypto kamu dengan sistem invoice + webhook, lengkap dengan struktur folder, endpoint, dan contoh request/response.

---

# 💸 Sanzy Crypto Payment Gateway

API backend sederhana untuk menerima pembayaran cryptocurrency via [NowPayments.io](https://nowpayments.io). Mendukung pembuatan invoice, integrasi webhook, autentikasi JWT, logging, dan notifikasi email.

---

## 📂 Struktur Proyek

```
.
├── app.js
├── .env
├── .gitignore
├── routes/
│   ├── payments.js
│   ├── webhook.js
│   ├── admin.js
│   └── auth.js
├── controllers/
│   ├── paymentController.js
│   └── webhookController.js
├── models/
│   ├── Transaction.js
│   └── User.js
├── utils/
│   ├── hash.js
│   ├── logger.js
│   ├── email.js
│   ├── verifyWebhook.js
│   └── nowpayments.js
├── validators/
│   └── paymentValidator.js
├── middleware/
│   └── authMiddleware.js
├── config/
│   └── nowpayments.js
└── seedAdmin.js
```

---

## 🔐 Autentikasi

Login untuk mendapatkan JWT token:

### `POST /api/auth/login`

**Body:**

```json
{
  "email": "admin@sanzy.com",
  "password": "admin123"
}
```

**Response:**

```json
{
  "token": "your_jwt_token"
}
```

Gunakan token ini sebagai `Authorization: Bearer <token>` pada endpoint lainnya.

---

## 💳 Invoice / Payment

### `POST /api/payment/create`

Membuat invoice baru.

**Header:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Body:**

```json
{
  "user_id": "661ff...",
  "price_amount": 100,
  "price_currency": "USD",
  "order_id": "ORDER001",
  "order_description": "Topup saldo",
  "ipn_callback_url": "https://yourdomain.com/api/payment/webhook",
  "success_url": "https://yourdomain.com/payment/success",
  "cancel_url": "https://yourdomain.com/payment/cancel",
  "customer_email": "user@example.com"
}
```

**Response:**

```json
{
  "id": "invoice_id",
  "order_id": "ORDER001",
  "invoice_url": "https://nowpayments.io/invoice/abc123",
  ...
}
```

---

### `GET /api/payment/history`

Melihat riwayat transaksi user (atau semua jika admin).

**Query Params:**

* `email` (opsional)
* `status` (opsional) → `waiting`, `confirmed`, `finished`, `expired`
* `order_id` (opsional)
* `page`, `limit` (pagination)

**Header:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "transactions": [...],
  "total": 12,
  "page": 1,
  "limit": 10
}
```

---

## 🧾 Admin Only

### `GET /api/admin/transactions`

Melihat semua transaksi di sistem (khusus admin).

**Header:**

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔁 Webhook NowPayments

### `POST /api/payment/webhook`

Menerima webhook dari NowPayments saat status pembayaran berubah.

**Header:**

```
x-nowpayments-sig: HMAC_SIGNATURE
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "payment_id": "123",
  "invoice_id": "abc",
  "payment_status": "finished",
  "pay_address": "1BitcoinAddress",
  "pay_currency": "BTC"
}
```

📌 Signature diverifikasi dengan `HMAC SHA512` berdasarkan `process.env.WEBHOOK_SECRET`. Pastikan header `x-nowpayments-sig` dikirim.

Jika pembayaran `finished`, sistem:

* Update status transaksi di database
* Kirim email ke `customer_email`
* Log aktivitas via Winston

---

## 🔧 Konfigurasi `.env`

Contoh `.env`:

```
PORT=3000
MONGODB_URI=mongodb+srv://...yourMongoString...
JWT_SECRET=your_jwt_secret
NOWPAYMENTS_API_KEY=your_api_key
EMAIL_USER=your@email.com
EMAIL_PASS=your_app_password
WEBHOOK_SECRET=your_webhook_secret
```

---

## 📥 Seeding Admin

Untuk membuat akun admin default:

```bash
node seedAdmin.js
```

Akun default:

```bash
email: admin@sanzy.com
password: admin123
```

---

## 🧾 Log & Monitoring

Log transaksi disimpan harian (rotasi otomatis) di folder `logs/`:

```bash
logs/2025-06-14-transactions.log.gz
```

Log mencakup: event `payment_finished`, email tujuan, order\_id, waktu, dst.

---

## ✅ Flow Diagram

```txt
[FE Login] ---> /auth/login ---> JWT

[FE Invoice] ---> /payment/create ---> Simpan DB + Kirim ke NowPayments

[NowPayments Webhook] ---> /payment/webhook
     ⤷ Verifikasi Signature
     ⤷ Update status
     ⤷ Kirim email + Log
```

---
