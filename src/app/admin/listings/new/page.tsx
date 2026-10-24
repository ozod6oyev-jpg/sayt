import Link from "next/link";
import { createListing } from "@/app/actions/admin";
import { ListingForm } from "@/components/admin/listing-form";
import { getDict } from "@/lib/i18n";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewListingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const t = getDict("uz");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/listings" className="text-xs font-medium text-brand-700">
          ← {t.admin.listings}
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900">{t.admin.newListing}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Qoralama sifatida saqlanadi — tayyor bo'lganda holatni "Faol" qiling.
        </p>
      </div>

      <ListingForm action={createListing} error={error} />
    </div>
  );
}
