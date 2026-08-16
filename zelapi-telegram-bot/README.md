# ZELAPI Telegram Bot

Bot Telegram Node.js untuk endpoint ZELAPI yang diberikan.

## Endpoint yang digunakan

- GET `/api/services`
- GET `/api/countries?service=...`
- POST `/api/request_number`
- GET `/api/my_numbers`
- POST `/api/release_number`
- GET `/api/latest_otp?number=...`
- GET `/api/my_otps?limit=...`
- GET `/api/stats/detailed?period=...`

`/api/otp` public live feed sengaja tidak dibuat sebagai command karena feed tersebut berisi OTP dari semua pesan/public feed dan tidak diperlukan untuk mengelola nomor milik bot.

## Command

- `/start` atau `/menu`
- `/help`
- `/services`
- `/countries WhatsApp`
- `/buy WhatsApp Indonesia`
- `/numbers`
- `/otp 628xxxxxxxxxx`
- `/myotps`
- `/myotps 20`
- `/release 628xxxxxxxxxx`
- `/stats`
- `/stats daily`
- `/stats weekly`
- `/stats monthly`

## Instalasi

```bash
npm install
```

Buat file `.env` berdasarkan `.env.example`:

```env
BOT_TOKEN=TOKEN_BOT_TELEGRAM
ZELAPI_BASE_URL=https://smsku.zelapi.eu.cc
```

Lalu:

```bash
npm start
```

## Penting tentang POST

Dokumentasi yang diberikan hanya menyebut method dan endpoint POST, tetapi tidak memberikan schema body JSON.

Versi ini menggunakan:

`POST /api/request_number`
```json
{"service":"WhatsApp","country":"Indonesia"}
```

`POST /api/release_number`
```json
{"number":"628xxxxxxxxxx"}
```

Jika API ZELAPI mengharuskan nama field/body yang berbeda, error 400 dari server akan ditampilkan oleh bot. Tidak ada endpoint atau parameter yang sengaja ditebak selain body tersebut.

Jangan masukkan token Telegram ke `bot.js` atau commit `.env` ke GitHub.
