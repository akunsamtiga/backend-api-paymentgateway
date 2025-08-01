
# 💸 SanzyPay — Payment Gateway via NowPayments + Telegram Bot

SanzyPay is a crypto payment gateway system based on [NowPayments.io](https://nowpayments.io), integrated with Telegram Bot and Node.js backend without authentication.

---

## 🚀 Main Features

- ✅ Invoice creation (web/telegram)
- ✅ Crypto payment integration via NowPayments
- ✅ Automatic webhook: status update + Telegram notification + XSID refill
- ✅ Admin Dashboard (no login required)
- ✅ Public transaction history
- ✅ Transaction statistics
- ✅ Success email notifications
- ✅ No authentication — suitable for public services/Telegram Bot

---

## 📦 Technology

- **Backend:** Express.js + MongoDB
- **Bot:** `node-telegram-bot-api`
- **Email:** Nodemailer (Gmail)
- **Webhook Signature:** HMAC SHA512 (NowPayments)
- **Rate Limiter:** express-rate-limit
- **Logger:** winston + daily-rotate

---

## ⚙️ Installation

1. Clone this repo:

```bash
git clone https://github.com/namamu/sanzypay.git
cd sanzypay
````

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

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

4. Run backend:

```bash
npm run dev
```

5. Run bot:

```bash
node telegram/bot.js
```

---

## 🌐 API Endpoints

All endpoints are **public** and **require no authentication**.

| Method | Endpoint                       | Description                        |
| ------ | ------------------------------ | ---------------------------------- |
| POST   | `/api/payment/create`          | Create manual invoice (via panel) |
| POST   | `/api/payment/telegram-create` | Create invoice from Telegram bot   |
| POST   | `/api/payment/webhook`         | Webhook from NowPayments           |
| GET    | `/api/payment/history`         | View transaction history           |
| GET    | `/api/payment/admin/stats`     | General statistics                 |
| GET    | `/api/payment/:invoice_id`     | Invoice details                    |

> 📎 Complete endpoint documentation available at: `docs/api.md`

---

## 🤖 Telegram Bot

Bot uses polling & supports:

* `/start` — welcome message
* `/bind xsid-xxx` — connect Telegram to XSID account
* `/topup <amount>` — create invoice directly via NowPayments

---

## 🔐 Webhook Signature (NowPayments)

For security, webhook is validated with `x-nowpayments-sig` (HMAC-SHA512).

Check manual signature test example:

```bash
node tesSignature/signature_finished.js
```

---

## 📊 Admin Dashboard

Frontend dashboard provided (no login) for:

* View statistics
* Create invoices
* Transaction history
* View invoice details

---

## 📁 Folder Structure

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

## 📞 Contact

Developer: **Sanzy ([sanzyxsid@gmail.com](mailto:sanzyxsid@gmail.com))**
Freelance projects via Telegram: `@SanzyXSID`

---

## 📝 License

MIT License — free to use & modify.
