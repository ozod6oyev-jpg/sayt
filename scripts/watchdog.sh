#!/usr/bin/env bash
# UyJoy watchdog: har ikki Next.js instansiyasi, sog'lomlik hisoboti va kunlik backup holatini tekshiradi.
set -uo pipefail

ENV_FILE=/etc/uyjoy/telegram.env
BACKUP_DIR=/home/admin/sayt/backups
STATE_DIR=/var/tmp/uyjoy-watchdog
HEARTBEAT_FILE="$STATE_DIR/last-health"
START_FILE="$STATE_DIR/last-start"
HEARTBEAT_SECONDS=21600 # 6 soat
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

# Oxirgi to'liq daqiqada nginx qabul qilgan so'rovlar soni
requests_per_minute() {
  local log=/var/log/nginx/access.log
  [ -r "$log" ] || {
    echo "?"
    return 0
  }

  local stamp count
  stamp=$(date -u -d '-1 minute' '+%d/%b/%Y:%H:%M')
  count=$(tail -n 20000 "$log" 2>/dev/null | grep -c "\[${stamp}" || true)
  echo "${count:-0}"
}

uptime_text() {
  local pid seconds
  pid=$(systemctl show -p MainPID --value uyjoy.service 2>/dev/null)
  seconds=$(ps -o etimes= -p "${pid:-0}" 2>/dev/null | tr -d ' ')
  if [ -z "${seconds:-}" ]; then
    echo "?"
    return 0
  fi
  if [ "$seconds" -lt 3600 ]; then
    echo "$((seconds / 60)) daqiqa"
  else
    echo "$((seconds / 3600)) soat"
  fi
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

# Sog'lom bo'lsa: qayta ishga tushishni xabar qilamiz va har 6 soatda hisobot yuboramiz
if healthy 3000 && healthy 3001; then
  started=$(systemctl show -p ActiveEnterTimestamp --value uyjoy.service 2>/dev/null)
  previous_start=$(cat "$START_FILE" 2>/dev/null || true)
  printf '%s' "$started" >"$START_FILE" 2>/dev/null || true

  if [ -n "$previous_start" ] && [ -n "$started" ] && [ "$started" != "$previous_start" ]; then
    notify "🔄 Sayt qayta ishga tushdi va sog'lom ishlayapti ✅
Ishlash vaqti: $(uptime_text) · So'rovlar: $(requests_per_minute) ta/daqiqa"
  fi

  now=$(date +%s)
  last=$(cat "$HEARTBEAT_FILE" 2>/dev/null || echo 0)
  [ -n "$last" ] || last=0

  if [ $((now - last)) -ge "$HEARTBEAT_SECONDS" ]; then
    printf '%s' "$now" >"$HEARTBEAT_FILE" 2>/dev/null || true
    notify "✅ Sayt sog'lom ishlayapti (6 soatlik hisobot)
uyjoy: active · uyjoy2: active · nginx: $(systemctl is-active nginx 2>/dev/null || echo '?')
Ishlash vaqti: $(uptime_text) · So'rovlar: $(requests_per_minute) ta/daqiqa"
  fi
fi

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
