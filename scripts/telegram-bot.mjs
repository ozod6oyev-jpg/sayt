import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";
import { runBackup } from "./backup-db.mjs";

const execFileAsync = promisify(execFile);

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !OWNER_CHAT_ID) {
  console.error("TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID o'rnatilmagan.");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;

// Kelgan xabarlarni panelga yozish uchun (owner chatidan tashqari)
const prismaClient = new PrismaClient();

function messageText(message) {
  if (message.text) return message.text;
  if (message.caption) return message.caption;
  if (message.photo) return "[rasm]";
  if (message.video) return "[video]";
  if (message.voice) return "[ovozli xabar]";
  if (message.document) return `[fayl: ${message.document.file_name ?? "hujjat"}]`;
  if (message.sticker) return "[stiker]";
  if (message.location) return "[joylashuv]";
  return "[xabar]";
}

async function storeIncoming(message) {
  const chat = message.chat;
  if (!chat || chat.type === "channel") return;
  if (String(chat.id) === String(OWNER_CHAT_ID)) return;

  const title =
    chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(" ") || String(chat.id);

  try {
    const storedChat = await prismaClient.telegramChat.upsert({
      where: { chatId: String(chat.id) },
      create: {
        chatId: String(chat.id),
        title,
        username: chat.username ?? message.from?.username ?? null,
        type: chat.type,
        lastMessageAt: new Date(message.date * 1000),
      },
      update: { title, lastMessageAt: new Date(message.date * 1000) },
    });

    const stored = await prismaClient.telegramMessage.create({
      data: {
        chatRefId: storedChat.id,
        tgMessageId: message.message_id,
        direction: "in",
        text: messageText(message),
        fromName: title,
        createdAt: new Date(message.date * 1000),
      },
    });

    await prismaClient.adminNotification.create({
      data: {
        kind: "telegram",
        title: `Telegram \u00b7 ${title}`,
        body: stored.text.slice(0, 500),
        href: "/admin/meta/xabarlar",
      },
    });
  } catch (error) {
    if (error?.code !== "P2002") {
      console.error("Xabarni saqlashda xato:", error?.message ?? error);
    }
  }
}

async function api(method, payload) {
  const response = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json().catch(() => null);
}

async function reply(chatId, text) {
  await api("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}

async function systemStatus() {
  const prisma = new PrismaClient();
  let stats = { listings: 0, articles: 0, devices: 0 };

  try {
    const [listings, articles, devices] = await Promise.all([
      prisma.listing.count(),
      prisma.article.count(),
      prisma.verifiedDevice.count(),
    ]);
    stats = { listings, articles, devices };
  } finally {
    await prisma.$disconnect();
  }

  const services = {};
  for (const name of ["uyjoy", "uyjoy2", "nginx"]) {
    try {
      const { stdout } = await execFileAsync("systemctl", ["is-active", name]);
      services[name] = stdout.trim();
    } catch {
      services[name] = "inactive";
    }
  }

  let dbSize = 0;
  try {
    const info = await fs.stat(path.join(process.cwd(), "prisma", "dev.db"));
    dbSize = info.size;
  } catch {
    dbSize = 0;
  }

  const mem = process.memoryUsage();
  const uptimeHours = (process.uptime() / 3600).toFixed(1);
  const disk = await execFileAsync("df", ["-h", "/"]).then(({ stdout }) =>
    stdout.trim().split("\n")[1]?.replace(/\s+/g, " "),
  );

  return [
    "<b>Holat</b>",
    `uyjoy: ${services.uyjoy} · uyjoy2: ${services.uyjoy2} · nginx: ${services.nginx}`,
    `E'lonlar: ${stats.listings} · Maqolalar: ${stats.articles} · Qurilmalar: ${stats.devices}`,
    `Baza: ${(dbSize / 1024).toFixed(0)} KB · RSS: ${(mem.rss / 1024 / 1024).toFixed(0)} MB · Uptime: ${uptimeHours} soat`,
    `Disk: ${disk ?? "?"}`,
  ].join("\n");
}

async function makeBackup(chatId) {
  await reply(chatId, "⏳ Backup tayyorlanmoqda...");

  try {
    const { sizeMb, sent } = await runBackup();
    await reply(
      chatId,
      sent
        ? `✅ Backup Telegramga yuborildi (${sizeMb} MB).`
        : `⚠️ Backup lokal saqlandi (${sizeMb} MB), lekin Telegramga yuborilmadi.`,
    );
  } catch (error) {
    console.error("Backup xatosi:", error);
    await reply(chatId, "❌ Backupda xatolik yuz berdi. Loglarni tekshiring.");
  }
}

const HELP = [
  "<b>Real sotamiz — server boti</b>",
  "/status — server va baza holati",
  "/backup — darhol backup olib, shu chatga yuborish",
  "/help — yordam",
].join("\n");

async function handleUpdate(update) {
  const message = update.message;
  if (!message) return;

  await storeIncoming(message);

  const chatId = String(message.chat?.id ?? "");
  const fromId = String(message.from?.id ?? "");

  // Faqat egasiga javob beriladi, boshqalarga to'liq jim
  if (chatId !== String(OWNER_CHAT_ID) || fromId !== String(OWNER_CHAT_ID)) return;

  const text = (message.text ?? "").trim();
  const command = text.split(/\s+/)[0]?.toLowerCase().replace(/@.*$/, "");

  if (command === "/start" || command === "/help") {
    await reply(chatId, HELP);
    return;
  }

  if (command === "/status") {
    await reply(chatId, await systemStatus());
    return;
  }

  if (command === "/backup") {
    await makeBackup(chatId);
    return;
  }

  await reply(chatId, HELP);
}

async function main() {
  console.log("Telegram bot ishga tushdi. Faqat owner chatiga javob beradi.");
  let offset = 0;

  for (;;) {
    try {
      const response = await fetch(`${API}/getUpdates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          offset,
          timeout: 50,
          allowed_updates: ["message"],
        }),
      });

      if (response.status === 409) {
        console.error("Boshqa bot instansiyasi ishlayapti (409). 10 s kutamiz.");
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        continue;
      }

      const payload = await response.json().catch(() => null);
      if (!payload?.ok) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }

      for (const update of payload.result ?? []) {
        offset = Math.max(offset, update.update_id + 1);
        await handleUpdate(update);
      }
    } catch (error) {
      console.error("Polling xatosi:", error?.message ?? error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

main();
