import { redirect } from "next/navigation";
import { login } from "@/app/actions/admin";
import { isAdmin } from "@/lib/auth";
import { getDict } from "@/lib/i18n";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  if (await isAdmin()) {
    redirect("/admin");
  }

  const params = await searchParams;
  const error = params.error;
  const hasError = Array.isArray(error) ? error[0] === "1" : error === "1";

  const t = getDict("uz");

  return (
    <div className="card w-full max-w-sm p-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
          U
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">UyJoy</p>
          <p className="text-xs text-slate-500">{t.admin.title}</p>
        </div>
      </div>

      <h1 className="text-lg font-semibold text-slate-900">{t.admin.login}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Davom etish uchun boshqaruv paneli parolini kiriting.
      </p>

      {hasError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Parol noto'g'ri. Qayta urinib ko'ring.
        </p>
      )}

      <form action={login} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="password">
            {t.admin.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            className="field"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          {t.admin.login}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Bu sahifa qidiruv tizimlariga yopiq.
      </p>
    </div>
  );
}
