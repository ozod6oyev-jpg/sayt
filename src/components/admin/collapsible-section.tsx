"use client";

import { useState, type ReactNode } from "react";

export function CollapsibleSection({
  title,
  hideLabel,
  showLabel,
  defaultOpen = false,
  children,
}: {
  title: string;
  hideLabel: string;
  showLabel: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <button type="button" onClick={() => setOpen((value) => !value)} className="btn-secondary text-xs">
          {open ? hideLabel : showLabel}
        </button>
      </div>

      {open && <div className="space-y-5">{children}</div>}
    </div>
  );
}
