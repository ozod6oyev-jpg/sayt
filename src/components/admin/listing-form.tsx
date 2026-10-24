import type { Listing } from "@prisma/client";
import Link from "next/link";
import { getDict } from "@/lib/i18n";

const t = getDict("uz");

const ERROR_MESSAGES: Record<string, string> = {
  required: "Majburiy maydonlarni to'ldiring (sarlavha, tuman, manzil, telefon).",
  price: "Narxni to'g'ri kiriting.",
};

export function ListingForm({
  action,
  listing,
  saleOptions,
  error,
  saved,
}: {
  action: (formData: FormData) => Promise<void>;
  listing?: Listing;
  saleOptions: { id: string; nameUz: string; nameRu: string }[];
  error?: string;
  saved?: string;
}) {
  return (
    <form action={action} className="card space-y-6 p-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? "Xatolik yuz berdi. Qayta urinib ko'ring."}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">Saqlandi.</p>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Asosiy ma'lumot
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="titleUz">
              {t.admin.fields.titleUz} *
            </label>
            <input
              id="titleUz"
              name="titleUz"
              required
              defaultValue={listing?.titleUz}
              className="field"
              placeholder="Chilonzorda 3 xonali kvartira"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="titleRu">
              {t.admin.fields.titleRu} *
            </label>
            <input
              id="titleRu"
              name="titleRu"
              required
              defaultValue={listing?.titleRu}
              className="field"
              placeholder="3-комнатная квартира в Чиланзаре"
            />
          </div>

          <div>
            <label className="label" htmlFor="saleOptionId">
              {t.admin.fields.saleOption}
            </label>
            <select
              id="saleOptionId"
              name="saleOptionId"
              defaultValue={listing?.saleOptionId ?? ""}
              className="field"
            >
              <option value="">—</option>
              {saleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.nameUz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="propertyType">
              {t.admin.fields.propertyType}
            </label>
            <select
              id="propertyType"
              name="propertyType"
              defaultValue={listing?.propertyType ?? "apartment"}
              className="field"
            >
              <option value="apartment">{t.propertyType.apartment}</option>
              <option value="house">{t.propertyType.house}</option>
              <option value="land">{t.propertyType.land}</option>
              <option value="commercial">{t.propertyType.commercial}</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="price">
              {t.admin.fields.price} *
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={listing ? listing.price.toString() : ""}
              className="field"
              placeholder="85000"
            />
          </div>

          <div>
            <label className="label" htmlFor="currency">
              {t.admin.fields.currency}
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue={listing?.currency ?? "USD"}
              className="field"
            >
              <option value="USD">USD</option>
              <option value="UZS">UZS</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="status">
              {t.admin.fields.status}
            </label>
            <select
              id="status"
              name="status"
              defaultValue={listing?.status ?? "draft"}
              className="field"
            >
              <option value="draft">{t.admin.draft}</option>
              <option value="active">{t.admin.active}</option>
              <option value="sold">{t.admin.sold}</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="slug">
              {t.admin.fields.slug}
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={listing?.slug}
              className="field"
              placeholder="avtomatik"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Xususiyatlar
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="rooms">
              {t.admin.fields.rooms}
            </label>
            <input
              id="rooms"
              name="rooms"
              type="number"
              min={0}
              max={30}
              defaultValue={listing?.rooms ?? ""}
              className="field"
            />
          </div>

          <div>
            <label className="label" htmlFor="area">
              {t.admin.fields.area}
            </label>
            <input
              id="area"
              name="area"
              type="number"
              min={0}
              defaultValue={listing?.area ?? ""}
              className="field"
            />
          </div>

          <div>
            <label className="label" htmlFor="floor">
              {t.admin.fields.floor}
            </label>
            <input
              id="floor"
              name="floor"
              type="number"
              min={0}
              defaultValue={listing?.floor ?? ""}
              className="field"
            />
          </div>

          <div>
            <label className="label" htmlFor="totalFloors">
              {t.admin.fields.totalFloors}
            </label>
            <input
              id="totalFloors"
              name="totalFloors"
              type="number"
              min={0}
              defaultValue={listing?.totalFloors ?? ""}
              className="field"
            />
          </div>

          <div>
            <label className="label" htmlFor="yearBuilt">
              {t.admin.fields.yearBuilt}
            </label>
            <input
              id="yearBuilt"
              name="yearBuilt"
              type="number"
              min={1800}
              max={2100}
              defaultValue={listing?.yearBuilt ?? ""}
              className="field"
            />
          </div>

          <div>
            <label className="label" htmlFor="condition">
              {t.admin.fields.condition}
            </label>
            <select
              id="condition"
              name="condition"
              defaultValue={listing?.condition ?? ""}
              className="field"
            >
              <option value="">—</option>
              <option value="new">{t.condition.new}</option>
              <option value="renovated">{t.condition.renovated}</option>
              <option value="average">{t.condition.average}</option>
              <option value="needsRepair">{t.condition.needsRepair}</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Joylashuv va aloqa
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="region">
              {t.admin.fields.region} *
            </label>
            <input
              id="region"
              name="region"
              required
              defaultValue={listing?.region}
              className="field"
              placeholder="Toshkent shahri"
            />
          </div>

          <div>
            <label className="label" htmlFor="district">
              {t.admin.fields.district} *
            </label>
            <input
              id="district"
              name="district"
              required
              defaultValue={listing?.district}
              className="field"
              placeholder="Chilonzor"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="address">
              {t.admin.fields.address} *
            </label>
            <input
              id="address"
              name="address"
              required
              defaultValue={listing?.address}
              className="field"
              placeholder="Bunyodkor ko'chasi, 12-uy"
            />
          </div>

          <div>
            <label className="label" htmlFor="phone">
              {t.admin.fields.phone} *
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={listing?.phone}
              className="field"
              placeholder="+998 90 123 45 67"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="lat">
                Lat
              </label>
              <input
                id="lat"
                name="lat"
                type="number"
                step="any"
                defaultValue={listing?.lat ?? ""}
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="lng">
                Lng
              </label>
              <input
                id="lng"
                name="lng"
                type="number"
                step="any"
                defaultValue={listing?.lng ?? ""}
                className="field"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Tavsif
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="label" htmlFor="descriptionUz">
              {t.admin.fields.descriptionUz}
            </label>
            <textarea
              id="descriptionUz"
              name="descriptionUz"
              rows={5}
              defaultValue={listing?.descriptionUz}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="descriptionRu">
              {t.admin.fields.descriptionRu}
            </label>
            <textarea
              id="descriptionRu"
              name="descriptionRu"
              rows={5}
              defaultValue={listing?.descriptionRu}
              className="field"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {t.admin.photos}
        </h2>
        <label className="label" htmlFor="photos">
          {t.admin.upload} (bir nechta rasm tanlash mumkin)
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          multiple
          accept="image/*"
          className="field file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
        />
        <p className="mt-2 text-xs text-slate-500">
          WebP formatiga avtomatik o'giriladi, 1920px dan katta rasmlar kichraytiriladi.
        </p>
      </section>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-5">
        <button type="submit" className="btn-primary">
          {t.admin.save}
        </button>
        <Link href="/admin/listings" className="btn-secondary">
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
