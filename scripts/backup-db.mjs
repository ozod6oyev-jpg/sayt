import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const execFileAsync = promisify(execFile);

const ROOT = process.cwd();
const BACKUP_DIR = path.join(ROOT, "backups");
const KEEP_DAYS = 14;

function databaseFile() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const raw = url.replace(/^file:/, "");

  return path.isAbsolute(raw) ? raw : path.join(ROOT, "prisma", raw);
}

function stamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

async function sendToTelegram(filePath, caption) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("Telegram sozlanmagan — backup faqat lokal saqlandi.");
    return false;
  }

  try {
    const file = await fs.readFile(filePath);
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", caption);
    form.append(
      "document",
      new Blob([file], { type: "application/zip" }),
      path.basename(filePath),
    );

    const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: form,
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      console.error("Telegram yuborishda xato:", response.status, payload?.description ?? "");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Telegramga ulanish xatosi:", error?.message ?? error);
    return false;
  }
}

async function cleanup() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const limit = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;

    for (const name of files) {
      if (!/^uyjoy-db-.*\.zip$/.test(name)) continue;

      const info = await fs.stat(path.join(BACKUP_DIR, name));
      if (info.mtimeMs < limit) {
        await fs.unlink(path.join(BACKUP_DIR, name));
        console.log("Eskirgan backup o'chirildi:", name);
      }
    }
  } catch (error) {
    console.error("Tozalashda xato:", error?.message ?? error);
  }
}

export async function runBackup() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  const dbFile = databaseFile();
  const id = stamp();
  const snapshot = path.join(BACKUP_DIR, `uyjoy-db-${id}.db`);
  const archive = path.join(BACKUP_DIR, `uyjoy-db-${id}.zip`);

  const prisma = new PrismaClient();
  try {
    // VACUUM INTO — WAL rejimida ham izchil nusxa oladi
    await prisma.$executeRawUnsafe(`VACUUM INTO '${snapshot.replace(/'/g, "''")}'`);
  } finally {
    await prisma.$disconnect();
  }

  await execFileAsync("zip", ["-j", "-9", archive, snapshot]);
  await fs.unlink(snapshot).catch(() => undefined);

  const info = await fs.stat(dbFile);
  const zipInfo = await fs.stat(archive);
  const sizeMb = (zipInfo.size / 1024 / 1024).toFixed(2);

  const caption = [
    "🗄 Real sotamiz — kunlik backup",
    `Sana: ${new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })}`,
    `Baza: ${(info.size / 1024).toFixed(0)} KB`,
    `Arxiv: ${sizeMb} MB`,
  ].join("\n");

  const sent = await sendToTelegram(archive, caption);
  await cleanup();

  return { archive, sizeMb, sent };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  runBackup()
    .then(({ archive, sizeMb, sent }) => {
      console.log(JSON.stringify({ archive, sizeMb, sent }));
    })
    .catch((error) => {
      console.error("Backup xatosi:", error);
      process.exit(1);
    });
}
