"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_SCRIPT_COOKIE, type AdminScript } from "@/lib/admin-script";
import { cn } from "@/lib/utils";

export function AdminScriptSwitcher({
  script,
  hint,
}: {
  script: AdminScript;
  hint: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: AdminScript) {
    if (next === script) return;

    document.cookie = `${ADMIN_SCRIPT_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  const next = script === "lat" ? "cyrl" : "lat";

  return (
    <button
      type="button"
      onClick={() => change(next)}
      aria-label={hint}
      title={hint}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-card text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900",
        pending && "opacity-60",
      )}
    >
      {script === "lat" ? "L" : "К"}
    </button>
  );
}
