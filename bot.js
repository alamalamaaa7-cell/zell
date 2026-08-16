require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TOKEN = process.env.BOT_TOKEN;
const BASE_URL = (process.env.ZELAPI_BASE_URL || "https://smsku.zelapi.eu.cc").replace(/\/+$/, "");

if (!TOKEN) {
  console.error("ERROR: BOT_TOKEN belum diisi di file .env");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "ZELAPI-Telegram-Bot/1.0"
  }
});

function jsonText(data, max = 3500) {
  let text;
  try {
    text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  } catch {
    text = String(data);
  }
  return text.length > max ? text.slice(0, max) + "\n... (dipotong)" : text;
}

function apiError(err) {
  if (err.response) {
    return `HTTP ${err.response.status}\n${jsonText(err.response.data, 1800)}`;
  }
  return err.code === "ECONNABORTED"
    ? "Request timeout."
    : err.message || "Unknown error.";
}

async function get(path, params) {
  const r = await api.get(path, { params });
  return r.data;
}

async function post(path, body) {
  const r = await api.post(path, body);
  return r.data;
}

function menu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📡 Services", callback_data: "services" },
          { text: "🌍 Countries", callback_data: "countries" }
        ],
        [
          { text: "📱 Nomor Aktif", callback_data: "numbers" },
          { text: "📨 OTP Saya", callback_data: "myotps" }
        ],
        [
          { text: "📊 Statistik", callback_data: "stats" },
          { text: "❓ Bantuan", callback_data: "help" }
        ]
      ]
    }
  };
}

function helpText() {
  return `🤖 *ZELAPI Telegram Bot*

*Command utama*
/start
/menu
/services
/countries WhatsApp
/buy WhatsApp Indonesia
/numbers
/otp 628xxxxxxxxxx
/myotps
/release 628xxxxxxxxxx
/stats daily

*Catatan*
• /buy mengirim POST /api/request_number dengan body { service, country }.
• /release mengirim POST /api/release_number dengan body { number }.
• /otp hanya mengecek nomor yang kamu masukkan.
• Bot tidak menampilkan /api/otp (public live feed) agar OTP pihak lain tidak ikut disebarkan.

Jika server ZELAPI menggunakan nama field POST yang berbeda, ubah fungsi requestNumber/releaseNumber di bot.js sesuai schema server.`;
}

async function sendApiResult(chatId, title, data) {
  return bot.sendMessage(
    chatId,
    `${title}\n\n\`\`\`json\n${jsonText(data)}\n\`\`\``,
    { parse_mode: "Markdown" }
  );
}

async function requestNumber(chatId, service, country) {
  await bot.sendMessage(chatId, "⏳ Meminta nomor virtual...");
  try {
    const data = await post("/api/request_number", { service, country });
    return sendApiResult(chatId, "📱 *Nomor virtual*", data);
  } catch (e) {
    return bot.sendMessage(chatId, `❌ Gagal meminta nomor.\n\n${apiError(e)}`);
  }
}

async function releaseNumber(chatId, number) {
  await bot.sendMessage(chatId, "⏳ Melepaskan nomor...");
  try {
    const data = await post("/api/release_number", { number });
    return sendApiResult(chatId, "♻️ *Release nomor*", data);
  } catch (e) {
    return bot.sendMessage(chatId, `❌ Gagal release nomor.\n\n${apiError(e)}`);
  }
}

bot.onText(/^\/(?:start|menu)$/i, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "👋 *ZELAPI Bot siap digunakan.*\n\nPilih menu atau gunakan command.",
    { parse_mode: "Markdown", ...menu() }
  );
});

bot.onText(/^\/help$/i, async (msg) => {
  await bot.sendMessage(msg.chat.id, helpText(), {
    parse_mode: "Markdown",
    ...menu()
  });
});

bot.onText(/^\/services$/i, async (msg) => {
  try {
    const data = await get("/api/services");
    await sendApiResult(msg.chat.id, "📡 *Services*", data);
  } catch (e) {
    await bot.sendMessage(msg.chat.id, `❌ Gagal mengambil services.\n\n${apiError(e)}`);
  }
});

bot.onText(/^\/countries(?:\s+(.+))?$/i, async (msg, match) => {
  const service = (match[1] || "").trim();
  if (!service) return bot.sendMessage(msg.chat.id, "Format: /countries WhatsApp");

  try {
    const data = await get("/api/countries", { service });
    await sendApiResult(msg.chat.id, `🌍 *Countries — ${service}*`, data);
  } catch (e) {
    await bot.sendMessage(msg.chat.id, `❌ Gagal mengambil countries.\n\n${apiError(e)}`);
  }
});

bot.onText(/^\/buy\s+(\S+)\s+(.+)$/i, async (msg, match) => {
  const service = match[1].trim();
  const country = match[2].trim();
  await requestNumber(msg.chat.id, service, country);
});

bot.onText(/^\/buy$/i, async (msg) => {
  await bot.sendMessage(msg.chat.id, "Format: /buy WhatsApp Indonesia");
});

bot.onText(/^\/numbers$/i, async (msg) => {
  try {
    const data = await get("/api/my_numbers");
    await sendApiResult(msg.chat.id, "📱 *Nomor Aktif Saya*", data);
  } catch (e) {
    await bot.sendMessage(msg.chat.id, `❌ Gagal mengambil nomor aktif.\n\n${apiError(e)}`);
  }
});

bot.onText(/^\/otp\s+(\d+)$/i, async (msg, match) => {
  const number = match[1];
  try {
    const data = await get("/api/latest_otp", { number });
    await sendApiResult(msg.chat.id, `📨 *OTP untuk ${number}*`, data);
  } catch (e) {
    await bot.sendMessage(msg.chat.id, `❌ Gagal mengambil OTP.\n\n${apiError(e)}`);
  }
});

bot.onText(/^\/otp$/i, async (msg) => {
  await bot.sendMessage(msg.chat.id, "Format: /otp 628xxxxxxxxxx");
});

bot.onText(/^\/myotps(?:\s+(\d+))?$/i, async (msg, match) => {
  const limit = Math.min(Math.max(Number(match[1] || 10), 1), 50);
  try {
    const data = await get("/api/my_otps", { limit });
    await sendApiResult(msg.chat.id, `📨 *Riwayat OTP (${limit})*`, data);
  } catch (e) {
    await bot.sendMessage(msg.chat.id, `❌ Gagal mengambil riwayat OTP.\n\n${apiError(e)}`);
  }
});

bot.onText(/^\/release\s+(\d+)$/i, async (msg, match) => {
  await releaseNumber(msg.chat.id, match[1]);
});

bot.onText(/^\/release$/i, async (msg) => {
  await bot.sendMessage(msg.chat.id, "Format: /release 628xxxxxxxxxx");
});

bot.onText(/^\/stats(?:\s+(daily|weekly|monthly))?$/i, async (msg, match) => {
  const period = match[1] || "daily";
  try {
    const data = await get("/api/stats/detailed", { period });
    await sendApiResult(msg.chat.id, `📊 *Statistik — ${period}*`, data);
  } catch (e) {
    await bot.sendMessage(msg.chat.id, `❌ Gagal mengambil statistik.\n\n${apiError(e)}`);
  }
});

bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;
  await bot.answerCallbackQuery(q.id);

  try {
    if (q.data === "services") {
      const data = await get("/api/services");
      return sendApiResult(chatId, "📡 *Services*", data);
    }
    if (q.data === "countries") {
      return bot.sendMessage(chatId, "Format: /countries WhatsApp");
    }
    if (q.data === "numbers") {
      const data = await get("/api/my_numbers");
      return sendApiResult(chatId, "📱 *Nomor Aktif Saya*", data);
    }
    if (q.data === "myotps") {
      const data = await get("/api/my_otps", { limit: 10 });
      return sendApiResult(chatId, "📨 *Riwayat OTP*", data);
    }
    if (q.data === "stats") {
      const data = await get("/api/stats/detailed", { period: "daily" });
      return sendApiResult(chatId, "📊 *Statistik — daily*", data);
    }
    if (q.data === "help") {
      return bot.sendMessage(chatId, helpText(), { parse_mode: "Markdown" });
    }
  } catch (e) {
    console.error("Callback:", e);
    await bot.sendMessage(chatId, `❌ Terjadi kesalahan.\n\n${apiError(e)}`);
  }
});

bot.on("polling_error", (e) => {
  console.error("Telegram polling error:", e.message);
});

console.log("================================");
console.log(" ZELAPI TELEGRAM BOT");
console.log("================================");
console.log(`ZELAPI: ${BASE_URL}`);
console.log("Status: BOT RUNNING");
