"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import {
  disablePush,
  pushState,
  resetPush,
  type PushState,
} from "@/lib/push-browser";
import { cn } from "@/lib/utils";

type TestState = "idle" | "sending" | "ok" | "fail";

export function PushRow({
  title,
  hintOn,
  hintOff,
  denied,
  unsupported,
  turnOn,
  turnOff,
  test,
  testOk,
  testFail,
}: {
  title: string;
  hintOn: string;
  hintOff: string;
  denied: string;
  unsupported: string;
  turnOn: string;
  turnOff: string;
  test: string;
  testOk: string;
  testFail: string;
}) {
  const [state, setState] = useState<PushState>("off");
  const [ready, setReady] = useState(false);
  const [testState, setTestState] = useState<TestState>("idle");

  useEffect(() => {
    let alive = true;

    // Panel ochilganda service worker'ning yangi versiyasini majburan tekshiramiz
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      void navigator.serviceWorker
        .getRegistration("/")
        .then((registration) => registration?.update())
        .catch(() => null);
    }

    void (async () => {
      // Obunani tiklash AdminPushSync zimmasida — bu yerda faqat holatni o'qiymiz
      const next = await pushState("admin");

      if (!alive) return;
      setState(next);
      setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function toggle() {
    if (state === "working" || state === "unsupported" || state === "denied") return;

    const previous = state;
    setState("working");

    const next = previous === "on" ? await disablePush("admin") : await resetPush("admin");
    setState(next);
  }

  async function ping(): Promise<boolean> {
    const response = await fetch("/api/admin/push/test", { method: "POST" });
    const data = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    return Boolean(data?.ok);
  }

  async function sendTest() {
    setTestState("sending");

    try {
      let ok = await ping();

      // Obuna eskirgan bo'lsa (server 410 oldi) — brauzerda yangisini yaratib qayta urinamiz
      if (!ok) {
        const next = await resetPush("admin");
        setState(next);
        if (next === "on") ok = await ping();
      }

      setTestState(ok ? "ok" : "fail");
    } catch {
      setTestState("fail");
    }

    window.setTimeout(() => setTestState("idle"), 4000);
  }

  const disabled = !ready || state === "working" || state === "denied" || state === "unsupported";
  const hint =
    state === "denied" ? denied : state === "unsupported" ? unsupported : state === "on" ? hintOn : hintOff;

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
      <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {state === "on" ? (
          <BellRing className="size-3.5 shrink-0 text-emerald-600" />
        ) : (
          <BellOff className="size-3.5 shrink-0" />
        )}
        <span className="truncate" title={hint}>
          {title}
        </span>
      </span>

      {!ready || state === "working" ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <span className="flex shrink-0 items-center gap-1">
          {state === "on" && (
            <button
              type="button"
              onClick={() => void sendTest()}
              disabled={testState === "sending"}
              title={testState === "ok" ? testOk : testState === "fail" ? testFail : test}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                testState === "ok"
                  ? "bg-emerald-50 text-emerald-700"
                  : testState === "fail"
                    ? "bg-red-50 text-red-600"
                    : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {testState === "sending" ? "…" : testState === "ok" ? "✓" : testState === "fail" ? "!" : test}
            </button>
          )}

          <button
            type="button"
            onClick={() => void toggle()}
            disabled={disabled}
            title={hint}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
              state === "on"
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : disabled
                  ? "bg-muted text-muted-foreground"
                  : "bg-brand-50 text-brand-800 hover:bg-brand-100",
            )}
          >
            {state === "on" ? turnOff : turnOn}
          </button>
        </span>
      )}
    </div>
  );
}
