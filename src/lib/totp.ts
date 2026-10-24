import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

/** 160 bitlik tasodifiy sirni base32 ko'rinishida yaratadi (Google Authenticator uchun) */
export function generateTotpSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac("sha1", base32Decode(secret)).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;

  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/** Berilgan vaqt uchun 6 xonali kod */
export function generateTotp(secret: string, timestamp: number = Date.now()): string {
  const counter = Math.floor(timestamp / 1000 / STEP_SECONDS);
  return hotp(secret, counter);
}

/** ±1 qadam (30 soniya) tolerantlik bilan kodni tekshiradi */
export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const clean = token.replace(/\s+/g, "");
  if (!new RegExp(`^\\d{${DIGITS}}$`).test(clean)) return false;

  const now = Date.now();

  for (let offset = -window; offset <= window; offset += 1) {
    const expected = generateTotp(secret, now + offset * STEP_SECONDS * 1000);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) {
      return true;
    }
  }

  return false;
}

/** Google Authenticator'ga qo'lda kiritish yoki QR yasash uchun URI */
export function otpauthUrl(secret: string, accountEmail: string, issuer = "UyJoy"): string {
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Sirni 4 belgidan bo'lib ko'rsatish — qo'lda kiritish oson bo'lsin */
export function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}
