import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { dashboardCopy } from "@/lib/admin-copy/dashboard";
import { getAdminCopy, getAdminScript } from "@/lib/admin-i18n";
import { formatNumber, formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminDashboardPage() {
  const c = await getAdminCopy(dashboardCopy);
  const script = await getAdminScript();

  const [totalListings, activeListings, viewsAgg, leadsCount, articlesCount, listings, leads] =
    await Promise.all([
      prisma.listing.count(),
      prisma.listing.count({ where: { status: "active" } }),
      prisma.listing.aggregate({ _sum: { views: true } }),
      prisma.lead.count(),
      prisma.article.count(),
      prisma.listing.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { listing: { select: { titleUz: true } } },
      }),
    ]);

  const stats = [
    { label: c.statTotal, value: formatNumber(totalListings, "uz") },
    { label: c.statActive, value: formatNumber(activeListings, "uz") },
    { label: c.statViews, value: formatNumber(viewsAgg._sum.views ?? 0, "uz") },
    { label: c.statLeads, value: formatNumber(leadsCount, "uz") },
    { label: c.statArticles, value: formatNumber(articlesCount, "uz") },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{c.title}</h1>
        <div className="flex gap-2">
          <Link href="/admin/listings/new" className="btn-primary text-xs">
            + {c.newListing}
          </Link>
          <Link href="/admin/articles/new" className="btn-secondary text-xs">
            + {c.newArticle}
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{c.listingsHeading}</h2>
          <Link href="/admin/listings" className="text-xs font-medium text-brand-700">
            {c.all}
          </Link>
        </div>

        {listings.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">{c.listingsEmpty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{c.colTitle}</th>
                  <th className="px-4 py-2 font-medium">{c.colPrice}</th>
                  <th className="px-4 py-2 font-medium">{c.colStatus}</th>
                  <th className="px-4 py-2 font-medium">{c.colDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((listing) => (
                  <tr key={listing.id}>
                    <td className="max-w-[320px] truncate px-4 py-2">
                      <Link
                        href={`/admin/listings/${listing.id}`}
                        className="font-medium text-slate-700 hover:text-brand-700"
                      >
                        {listing.titleUz}
                      </Link>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                      {formatPrice(listing.price, listing.currency, "uz")}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={listing.status} script={script} />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(listing.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{c.leadsHeading}</h2>
          <Link href="/admin/leads" className="text-xs font-medium text-brand-700">
            {c.all}
          </Link>
        </div>

        {leads.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">{c.leadsEmpty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{c.colName}</th>
                  <th className="px-4 py-2 font-medium">{c.colPhone}</th>
                  <th className="px-4 py-2 font-medium">{c.colListing}</th>
                  <th className="px-4 py-2 font-medium">{c.colDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-4 py-2 font-medium text-slate-700">{lead.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                      <a href={`tel:${lead.phone}`} className="hover:text-brand-700">
                        {lead.phone}
                      </a>
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-2 text-slate-500">
                      {lead.listing?.titleUz ?? "—"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(lead.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
