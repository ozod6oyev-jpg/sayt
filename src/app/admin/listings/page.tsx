import Image from "next/image";
import Link from "next/link";
import { deleteListing } from "@/app/actions/admin";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminCopy, getAdminScript } from "@/lib/admin-i18n";
import { listingsCopy } from "@/lib/admin-copy/listings";
import { formatNumber, formatPrice } from "@/lib/format";
import { leadsWithBoost } from "@/lib/lead-boost";
import { prisma } from "@/lib/prisma";

export default async function AdminListingsPage() {
  const c = await getAdminCopy(listingsCopy);
  const script = await getAdminScript();

  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      photos: { orderBy: { sort: "asc" }, take: 1 },
      _count: { select: { leads: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{c.title}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {c.total.replace("{n}", String(listings.length))}
          </p>
        </div>
        <Link href="/admin/listings/new" className="btn-primary text-xs">
          + {c.newListing}
        </Link>
      </div>

      <div className="card overflow-hidden">
        {listings.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-slate-500">{c.empty}</p>
            <Link href="/admin/listings/new" className="btn-primary mt-4 text-xs">
              {c.addFirst}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{c.thPhoto}</th>
                  <th className="px-4 py-2.5 font-medium">{c.thTitle}</th>
                  <th className="px-4 py-2.5 font-medium">{c.thPrice}</th>
                  <th className="px-4 py-2.5 font-medium">{c.thStatus}</th>
                  <th className="px-4 py-2.5 font-medium">{c.thDistrict}</th>
                  <th className="px-4 py-2.5 font-medium">{c.thViews}</th>
                  <th className="px-4 py-2.5 font-medium">{c.thLeads}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{c.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((listing) => {
                  const cover = listing.photos[0];

                  return (
                    <tr key={listing.id} className="align-middle">
                      <td className="px-4 py-2">
                        {cover ? (
                          <Image
                            src={cover.url}
                            alt={listing.titleUz}
                            width={cover.width}
                            height={cover.height}
                            className="h-12 w-16 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-16 items-center justify-center rounded-md bg-slate-100 text-[10px] text-slate-400">
                            {c.none}
                          </div>
                        )}
                      </td>
                      <td className="max-w-[280px] px-4 py-2">
                        <Link
                          href={`/admin/listings/${listing.id}`}
                          className="line-clamp-2 font-medium text-slate-700 hover:text-brand-700"
                        >
                          {listing.titleUz}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-400">{listing.slug}</p>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                        {formatPrice(listing.price, listing.currency, "uz")}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={listing.status} script={script} />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                        {listing.district}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {formatNumber(listing.views, "uz")}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {formatNumber(leadsWithBoost(listing._count.leads, listing.id), "uz")}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/listings/${listing.id}`}
                            className="text-xs font-medium text-brand-700 hover:underline"
                          >
                            {c.edit}
                          </Link>
                          <form action={deleteListing.bind(null, listing.id)}>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        {c.viewOnSite}{" "}
        <Link href="/uz/elonlar" className="text-brand-700 hover:underline">
          /uz/elonlar
        </Link>
      </p>
    </div>
  );
}
