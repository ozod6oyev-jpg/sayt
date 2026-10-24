import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyTwoFactor } from "@/app/actions/auth";
import { readPendingUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TwoFactorPage({ searchParams }: PageProps) {
  const userId = await readPendingUserId();
  if (!userId) {
    redirect("/kirish");
  }

  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <div className="card w-full max-w-sm p-8">
      <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">
        Ikkinchi bosqich
      </p>
      <h1 className="mt-2 text-lg font-semibold text-slate-900">Authenticator kodi</h1>
      <p className="mt-1 text-sm text-slate-500">
        Google Authenticator ilovasidagi 6 xonali kodni kiriting.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Kod noto'g'ri yoki muddati o'tgan. Yangi kodni kiritib qayta urinib ko'ring.
        </p>
      )}

      <form action={verifyTwoFactor} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="token">
            6 xonali kod
          </label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            className="field text-center text-2xl tracking-[0.5em]"
            placeholder="000000"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          Tasdiqlash
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Kod ishlamayaptimi?{" "}
        <Link href="/kirish" className="text-brand-700 hover:underline">
          Boshidan boshlash
        </Link>
      </p>
    </div>
  );
}
