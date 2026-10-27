import { Info } from "lucide-react";

export function InboxInfo({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <details className="relative shrink-0">
      <summary
        className="grid size-8 cursor-pointer list-none place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground [&::-webkit-details-marker]:hidden"
        aria-label={title}
      >
        <Info className="size-4" />
      </summary>

      <div className="absolute right-0 z-40 mt-1 w-64 rounded-xl border border-border bg-background p-3 shadow-lg">
        <p className="text-xs font-semibold text-foreground">{title}</p>

        <dl className="mt-2 space-y-1.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-[11px] text-muted-foreground">{row.label}</dt>
              <dd className="min-w-0 truncate text-right text-[11px] font-medium text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  );
}
