"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Copy, Loader2, ShieldCheck, Smartphone } from "lucide-react";

type Device = {
  key: string;
  label: string;
  isTrusted: boolean;
  visits: number;
  createdAt: string;
  lastSeenAt: string;
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

export function DeviceVerify() {
  const [device, setDevice] = useState<Device | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [info, setInfo] = useState<{ platform: string; screen: string; timezone: string; language: string }>({
    platform: "",
    screen: "",
    timezone: "",
    language: "",
  });

  useEffect(() => {
    const payload = {
      platform: navigator.platform || "",
      language: navigator.language || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      screen: typeof window === "undefined" ? "" : `${window.screen.width}x${window.screen.height}`,
    };
    setInfo(payload);

    fetch("/api/verify-device", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("failed"))))
      .then((data: Device) => setDevice(data))
      .catch(() => setError(true));
  }, []);

  async function copyKey() {
    if (!device) return;

    try {
      await navigator.clipboard.writeText(device.key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Kalitni nusxalang:", device.key);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-center gap-2.5">
        <Image
          src="/logo-mark.png"
          alt="Real sotamiz"
          width={36}
          height={36}
          className="h-9 w-9 rounded-lg object-cover"
        />
        <div>
          <p className="text-sm font-bold text-slate-900">Real sotamiz</p>
          <p className="text-[11px] text-slate-500">Qurilmani tasdiqlash</p>
        </div>
      </div>

      <h1 className="mt-5 text-lg font-bold text-slate-900">Bu qurilma aniqlandi</h1>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Quyidagi kalit shu qurilma uchun yaratildi. Uni administratorga yuboring — qurilma
        ishonchli ro'yxatiga qo'shiladi va boshqaruv paneliga kirish uchun ishlatiladi.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Qurilma ma'lumotlarini yuborishda xatolik. Sahifani yangilab qayta urinib ko'ring.
        </p>
      )}

      {!device && !error && (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" />
          Qurilma aniqlanmoqda...
        </p>
      )}

      {device && (
        <>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Qurilma kaliti
            </p>
            <p        className="mt-1.5 font-mono text-xl font-bold tracking-[0.08em] break-all text-slate-900 select-all">
              {device.key}
            </p>

            <button
              type="button"
              onClick={copyKey}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-brand-800 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-900"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Nusxa olindi" : "Kalitni nusxalash"}
            </button>
          </div>

          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Qurilma</dt>
              <dd className="flex items-center gap-1.5 font-medium text-slate-800">
                <Smartphone className="size-3.5 text-slate-400" />
                {device.label}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Ekran</dt>
              <dd className="font-medium text-slate-800">{info.screen}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Vaqt mintaqasi</dt>
              <dd className="max-w-[60%] truncate font-medium text-slate-800">{info.timezone}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Til</dt>
              <dd className="font-medium text-slate-800">{info.language}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Birinchi tashrif</dt>
              <dd className="font-medium text-slate-800">{formatDate(device.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Tashriflar</dt>
              <dd className="font-medium text-slate-800">{device.visits}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Holat</dt>
              <dd>
                {device.isTrusted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <ShieldCheck className="size-3.5" />
                    Ishonchli
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    Tasdiqlanmagan
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <p className="mt-5 rounded-lg bg-brand-50 px-3 py-2 text-[11px] leading-5 text-brand-800">
            Bu kalitni hech kimga bermang. Qurilma almashtirilsa yoki brauzer tozalansa, yangi
            kalit yaratiladi va uni qaytadan tasdiqlatish kerak bo'ladi.
          </p>
        </>
      )}

      <a
        href="/uz"
        className="mt-5 block text-center text-xs font-semibold text-brand-700 hover:underline"
      >
        Saytga qaytish
      </a>
    </div>
  );
}
