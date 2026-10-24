const STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: "Qoralama", className: "bg-slate-100 text-slate-600" },
  active: { label: "Faol", className: "bg-brand-50 text-brand-700" },
  sold: { label: "Sotilgan", className: "bg-amber-50 text-amber-700" },
};

export function StatusBadge({ status }: { status: string }) {
  const item = STATUS[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.className}`}
    >
      {item.label}
    </span>
  );
}

export function PublishedBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        published ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {published ? "Nashr etilgan" : "Qoralama"}
    </span>
  );
}
