#!/usr/bin/env bash
# UyJoy watchdog: har ikki Next.js instansiyasi va kunlik backup holatini tekshiradi.
set -uo pipefail

ENV_FILE=/etc/uyjoy/telegram.env
BACKUP_DIR=/home/admin/sayt/backups
STATE_DIR=/var/tmp/uyjoy-watchdog
mkdir -p "$STATE_DIR" 2>/dev/null || STATE_DIR=/tmp

notify() {
  [ -f "$ENV_FILE" ] || return 0
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ] || return 0
  curl -sS -m 15 -o /dev/null \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=$1" \
    --data-urlencode "disable_web_page_preview=true" || true
}

healthy() {
  curl -fsS -m 6 "http://127.0.0.1:$1/api/health" >/dev/null 2>&1
}

check_instance() {
  local port=$1 unit=$2
  healthy "$port" && return 0

  systemctl restart "$unit"
  sleep 4

  if healthy "$port"; then
    notify "⚠️ ${unit} javob bermadi — avtomatik qayta ishga tushirildi. Holat: tiklandi ✅"
  else
    notify "🚨 ${unit} ishlamayapti! Port ${port} /api/health javob bermaydi. Qo'lda tekshirish kerak."
  fi
}

check_instance 3000 uyjoy.service
check_instance 3001 uyjoy2.service

# Kunlik backup 30 soatdan eski bo'lsa, kuniga bir marta ogohlantirish
latest=$(find "$BACKUP_DIR" -maxdepth 1 -name 'uyjoy-backup-*.zip' -printf '%T@\n' 2>/dev/null | sort -nr | head -1 | cut -d. -f1)
if [ -n "${latest:-}" ]; then
  age_h=$(( ( $(date +%s) - latest ) / 3600 ))
  marker="$STATE_DIR/backup-alert-day"
  today=$(date +%F)
  if [ "$age_h" -ge 30 ] && [ "$(cat "$marker" 2>/dev/null)" != "$today" ]; then
    notify "⚠️ Oxirgi backup ${age_h} soat oldin olingan. Kunlik backup ishlamayotgan bo'lishi mumkin."
    echo "$today" > "$marker"
  fi
else
  marker="$STATE_DIR/backup-missing"
  if [ ! -f "$marker" ]; then
    notify "⚠️ Backup papkasida hali birorta zip topilmadi (${BACKUP_DIR})."
    date +%F > "$marker"
  fi
fi
