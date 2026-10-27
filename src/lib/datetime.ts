/**
 * Admin chat uchun sana/vaqt: Toshkent (UTC+5) bo'yicha, server va brauzerda
 * bir xil natija beradigan qo'lda formatlash (Intl ICU farqlarisiz).
 */

const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

const OFFSET_MS = 5 * 60 * 60 * 1000;

function shifted(value: Date | string): Date {
  return new Date(new Date(value).getTime() + OFFSET_MS);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** 23:12 */
export function timeLabel(value: Date | string): string {
  const date = shifted(value);
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/** 25 oktabr */
export function dayLabel(value: Date | string): string {
  const date = shifted(value);
  return `${pad(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]}`;
}

/** 23:12 yoki 25.10 */
export function listTime(value: Date | string): string {
  const date = shifted(value);
  const now = shifted(new Date());
  const sameDay =
    date.getUTCDate() === now.getUTCDate() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCFullYear() === now.getUTCFullYear();

  return sameDay
    ? `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
    : `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}`;
}

/** 25.10.2026 23:12 */
export function fullDate(value: Date | string): string {
  const date = shifted(value);
  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()} ${pad(
    date.getUTCHours(),
  )}:${pad(date.getUTCMinutes())}`;
}
