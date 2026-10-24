"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_SCRIPT_COOKIE, adminScriptOptions, type AdminScript } from "@/lib/admin-script";
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

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-slate-200 bg-card p-0.5",
        pending && "opacity-60",
      )}
      role="group"
      aria-label={hint}
      title={hint}
    >
      {adminScriptOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => change(option.value)}
          aria-pressed={script === option.value}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
            script === option.value
              ? "bg-brand-800 text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
