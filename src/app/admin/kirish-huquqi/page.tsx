import { deleteDevice, toggleDeviceTrust } from "@/app/actions/devices";
import { devicesCopy } from "@/lib/admin-copy/devices";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function AccessPage({ searchParams }: PageProps) {
  await requireOwner();

  const c = await getAdminCopy(devicesCopy);
  const query = await searchParams;
  const rawFilter = Array.isArray(query.filter) ? query.filter[0] : query.filter;
  const filter = rawFilter === "trusted" || rawFilter === "untrusted" ? rawFilter : "all";

  const devices = await prisma.verifiedDevice.findMany({
    where:
      filter === "trusted"
        ? { isTrusted: true }
        : filter === "untrusted"
          ? { isTrusted: false }
          : undefined,
    orderBy: [{ isTrusted: "desc" }, { lastSeenAt: "desc" }],
    take: 300,
  });

  const filters = [
    { value: "all", label: c.filterAll },
    { value: "trusted", label: c.filterTrusted },
    { value: "untrusted", label: c.filterUntrusted },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{c.title}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{c.subtitle}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {c.total.replace("{n}", String(devices.length))}
          </p>
        </div>
        <a
          href="/verifydev"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-xs"
        >
          {c.verifyPage} ↗
        </a>
      </div>

      <p className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-xs leading-5 text-brand-800">
        {c.hint}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {filters.map((item) => (
          <a
            key={item.value}
            href={item.value === "all" ? "/admin/kirish-huquqi" : `?filter=${item.value}`}
            className={
              filter === item.value
                ? "rounded-full bg-brand-800 px-3 py-1 text-xs font-semibold text-white"
                : "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            }
          >
            {item.label}
          </a>
        ))}
      </div>

      {devices.length === 0 ? (
        <div className="card px-4 py-16 text-center">
          <p className="text-sm text-slate-500">{c.empty}</p>
          <p className="mt-1 text-xs text-slate-400">{c.emptyHint}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{c.colDevice}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colKey}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colStatus}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colVisits}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colFirst}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colLast}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colIp}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{c.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((device) => (
                  <tr key={device.id} className="align-middle">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-800">{device.label}</p>
                      <p className="mt-0.5 max-w-[240px] truncate text-[11px] text-slate-400">
                        {device.platform || device.userAgent}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="font-mono rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
                        {device.key}
                      </code>
                    </td>
                    <td className="px-4 py-2.5">
                      {device.isTrusted ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          {c.trusted}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          {c.untrusted}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{device.visits}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(device.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(device.lastSeenAt)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {device.ip || c.unknown}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <form action={toggleDeviceTrust.bind(null, device.id)}>
                          <button
                            type="submit"
                            className="text-xs font-medium text-brand-700 hover:underline"
                          >
                            {device.isTrusted ? c.untrust : c.trust}
                          </button>
                        </form>
                        <form action={deleteDevice.bind(null, device.id)}>
                          <button
                            type="submit"
                            title={c.deleteTitle}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            {c.delete}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
