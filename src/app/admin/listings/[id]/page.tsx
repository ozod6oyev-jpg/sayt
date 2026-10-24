import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addListingPhotos, deletePhoto, updateListing } from "@/app/actions/admin";
import { ListingForm } from "@/components/admin/listing-form";
import { getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditListingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;
  const saved = Array.isArray(query.saved) ? query.saved[0] : query.saved;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { photos: { orderBy: { sort: "asc" } } },
  });

  if (!listing) {
    notFound();
  }

  const t = getDict("uz");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/listings" className="text-xs font-medium text-brand-700">
            ← {t.admin.listings}
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-900">{listing.titleUz}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.admin.edit} · {listing.slug}
          </p>
        </div>
        <Link
          href={`/uz/elonlar/${listing.slug}`}
          className="btn-secondary text-xs"
          target="_blank"
        >
          Saytda ko'rish ↗
        </Link>
      </div>

      <ListingForm
        action={updateListing.bind(null, listing.id)}
        listing={listing}
        error={error}
        saved={saved}
      />

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          {t.admin.photos} ({listing.photos.length})
        </h2>

        {listing.photos.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{t.admin.noPhotos}</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {listing.photos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-lg border border-slate-200">
                <Image
                  src={photo.url}
                  alt={photo.alt || listing.titleUz}
                  width={photo.width}
                  height={photo.height}
                  className="h-28 w-full object-cover"
                />
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-[11px] text-slate-400">#{photo.sort}</span>
                  <form action={deletePhoto.bind(null, photo.id, listing.id)}>
                    <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                      {t.admin.delete}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          action={addListingPhotos.bind(null, listing.id)}
          className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center"
        >
          <input
            name="photos"
            type="file"
            multiple
            accept="image/*"
            className="field file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
          />
          <button type="submit" className="btn-secondary shrink-0">
            {t.admin.upload}
          </button>
        </form>
      </section>
    </div>
  );
}
