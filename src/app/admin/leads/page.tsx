import Link from "next/link";
import { getAdminCopy } from "@/lib/admin-i18n";
import { peopleCopy } from "@/lib/admin-copy/people";
import { prisma } from "@/lib/prisma";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminLeadsPage() {
  const c = await getAdminCopy(peopleCopy);

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { listing: { select: { id: true, titleUz: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{c.leadsTitle}</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {c.leadsTotal.replace("{n}", String(leads.length))}
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="card px-4 py-16 text-center">
          <p className="text-sm text-slate-500">{c.leadsEmpty}</p>
          <p className="mt-1 text-xs text-slate-400">{c.leadsEmptyHint}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{c.colDate}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colName}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colPhone}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colListing}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colMessage}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{lead.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-slate-700 hover:text-brand-700"
                      >
                        {lead.phone}
                      </a>
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-slate-600">
                      {lead.listing ? (
                        <Link
                          href={`/admin/listings/${lead.listing.id}`}
                          className="line-clamp-2 hover:text-brand-700"
                        >
                          {lead.listing.titleUz}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[320px] px-4 py-3 text-slate-500">
                      {lead.message ? (
                        <span className="line-clamp-3 whitespace-pre-line">{lead.message}</span>
                      ) : (
                        "—"
                      )}
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
