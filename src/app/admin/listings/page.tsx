import Image from "next/image";
import Link from "next/link";
import { deleteListing } from "@/app/actions/admin";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatNumber, formatPrice } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export default async function AdminListingsPage() {
  const t = getDict("uz");

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
          <h1 className="text-xl font-bold text-slate-900">{t.admin.listings}</h1>
          <p className="mt-0.5 text-sm text-slate-500">Jami: {listings.length} ta</p>
        </div>
        <Link href="/admin/listings/new" className="btn-primary text-xs">
          + {t.admin.newListing}
        </Link>
      </div>

      <div className="card overflow-hidden">
        {listings.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-slate-500">Hozircha e'lon qo'shilmagan.</p>
            <Link href="/admin/listings/new" className="btn-primary mt-4 text-xs">
              Birinchi e'lonni qo'shish
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Rasm</th>
                  <th className="px-4 py-2.5 font-medium">Sarlavha</th>
                  <th className="px-4 py-2.5 font-medium">Narx</th>
                  <th className="px-4 py-2.5 font-medium">Holat</th>
                  <th className="px-4 py-2.5 font-medium">Tuman</th>
                  <th className="px-4 py-2.5 font-medium">Ko'rish</th>
                  <th className="px-4 py-2.5 font-medium">So'rov</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amallar</th>
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
                            Yo'q
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
                        <StatusBadge status={listing.status} />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                        {listing.district}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {formatNumber(listing.views, "uz")}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{listing._count.leads}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/listings/${listing.id}`}
                            className="text-xs font-medium text-brand-700 hover:underline"
                          >
                            {t.admin.edit}
                          </Link>
                          <form action={deleteListing.bind(null, listing.id)}>
                            <button
                              type="submit"
                              title="E'lon butunlay o'chiriladi"
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              {t.admin.delete}
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
        E'lonlarni saytda ko'rish uchun:{" "}
        <Link href="/uz/elonlar" className="text-brand-700 hover:underline">
          /uz/elonlar
        </Link>
      </p>
    </div>
  );
}
