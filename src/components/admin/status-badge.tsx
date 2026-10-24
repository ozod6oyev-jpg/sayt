import type { AdminScript } from "@/lib/admin-script";

const STATUS: Record<string, { lat: string; cyrl: string; className: string }> = {
  draft: { lat: "Qoralama", cyrl: "Қоралама", className: "bg-slate-100 text-slate-600" },
  active: { lat: "Faol", cyrl: "Фаол", className: "bg-brand-50 text-brand-700" },
  sold: { lat: "Sotilgan", cyrl: "Сотилган", className: "bg-amber-50 text-amber-700" },
};

export function StatusBadge({
  status,
  script = "lat",
}: {
  status: string;
  script?: AdminScript;
}) {
  const item = STATUS[status];

  if (!item) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.className}`}
    >
      {item[script]}
    </span>
  );
}

export function PublishedBadge({
  published,
  script = "lat",
}: {
  published: boolean;
  script?: AdminScript;
}) {
  const label = published
    ? script === "cyrl"
      ? "Нашр этилган"
      : "Nashr etilgan"
    : script === "cyrl"
      ? "Қоралама"
      : "Qoralama";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        published ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}
    </span>
  );
}
