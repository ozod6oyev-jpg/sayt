import type { Listing } from "@prisma/client";
import Link from "next/link";
import type { ListingsCopy } from "@/lib/admin-copy/listings";

export function ListingForm({
  action,
  listing,
  saleOptions,
  error,
  saved,
  copy,
}: {
  action: (formData: FormData) => Promise<void>;
  listing?: Listing;
  saleOptions: { id: string; nameUz: string; nameRu: string }[];
  error?: string;
  saved?: string;
  copy: ListingsCopy;
}) {
  const errorMessages: Record<string, string> = {
    required: copy.errorRequired,
    price: copy.errorPrice,
  };

  return (
    <form action={action} className="card space-y-6 p-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessages[error] ?? copy.errorGeneric}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">{copy.saved}</p>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {copy.sectionMain}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="titleUz">
              {copy.titleUz} *
            </label>
            <input
              id="titleUz"
              name="titleUz"
              required
              defaultValue={listing?.titleUz}
              className="field"
              placeholder={copy.titleUzPlaceholder}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="titleRu">
              {copy.titleRu} *
            </label>
            <input
              id="titleRu"
              name="titleRu"
              required
              defaultValue={listing?.titleRu}
              className="field"
              placeholder={copy.titleRuPlaceholder}
            />
          </div>

          <div>
            <label className="label" htmlFor="saleOptionId">
              {copy.saleOption}
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
              {copy.propertyType}
            </label>
            <select
              id="propertyType"
              name="propertyType"
              defaultValue={listing?.propertyType ?? "apartment"}
              className="field"
            >
              <option value="apartment">{copy.apartment}</option>
              <option value="house">{copy.house}</option>
              <option value="land">{copy.land}</option>
              <option value="commercial">{copy.commercial}</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="price">
              {copy.price} *
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
              {copy.currency}
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
              {copy.status}
            </label>
            <select
              id="status"
              name="status"
              defaultValue={listing?.status ?? "draft"}
              className="field"
            >
              <option value="draft">{copy.draft}</option>
              <option value="active">{copy.active}</option>
              <option value="sold">{copy.sold}</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="slug">
              {copy.slug}
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={listing?.slug}
              className="field"
              placeholder={copy.slugPlaceholder}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {copy.sectionFeatures}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="rooms">
              {copy.rooms}
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
              {copy.area}
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
              {copy.floor}
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
              {copy.totalFloors}
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
              {copy.yearBuilt}
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
              {copy.condition}
            </label>
            <select
              id="condition"
              name="condition"
              defaultValue={listing?.condition ?? ""}
              className="field"
            >
              <option value="">—</option>
              <option value="new">{copy.conditionNew}</option>
              <option value="renovated">{copy.conditionRenovated}</option>
              <option value="average">{copy.conditionAverage}</option>
              <option value="needsRepair">{copy.conditionNeedsRepair}</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {copy.sectionLocation}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="region">
              {copy.region} *
            </label>
            <input
              id="region"
              name="region"
              required
              defaultValue={listing?.region}
              className="field"
              placeholder={copy.regionPlaceholder}
            />
          </div>

          <div>
            <label className="label" htmlFor="district">
              {copy.district} *
            </label>
            <input
              id="district"
              name="district"
              required
              defaultValue={listing?.district}
              className="field"
              placeholder={copy.districtPlaceholder}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="address">
              {copy.address} *
            </label>
            <input
              id="address"
              name="address"
              required
              defaultValue={listing?.address}
              className="field"
              placeholder={copy.addressPlaceholder}
            />
          </div>

          <div>
            <label className="label" htmlFor="phone">
              {copy.phone} *
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={listing?.phone}
              className="field"
              placeholder={copy.phonePlaceholder}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="lat">
                {copy.lat}
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
                {copy.lng}
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
          {copy.sectionDescription}
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="label" htmlFor="descriptionUz">
              {copy.descriptionUz}
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
              {copy.descriptionRu}
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
          {copy.photos}
        </h2>
        <label className="label" htmlFor="photos">
          {copy.uploadLabel}
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          multiple
          accept="image/*"
          className="field file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
        />
        <p className="mt-2 text-xs text-slate-500">{copy.uploadHint}</p>
      </section>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-5">
        <button type="submit" className="btn-primary">
          {copy.save}
        </button>
        <Link href="/admin/listings" className="btn-secondary">
          {copy.cancel}
        </Link>
      </div>
    </form>
  );
}
