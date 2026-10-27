"use client";

import { useFormStatus } from "react-dom";

export function SyncHistoryButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn-secondary text-xs" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
