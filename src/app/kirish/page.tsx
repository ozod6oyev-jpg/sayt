import Image from "next/image";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { getDict, siteName } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  if ((await prisma.adminUser.count()) === 0) {
    redirect("/kirish/sozlash");
  }

  if (await getCurrentUser()) {
    redirect("/admin");
  }

  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const t = getDict("uz");

  return (
    <div className="card w-full max-w-sm p-8">
      <div className="mb-6 flex items-center gap-2">
        <Image
          src="/logo-mark.png"
          alt={siteName}
          width={36}
          height={36}
          className="h-9 w-9 rounded-lg object-cover"
        />
        <div>
          <p className="text-sm font-semibold text-slate-900">{siteName}</p>
          <p className="text-xs text-slate-500">{t.admin.title}</p>
        </div>
      </div>

      <h1 className="text-lg font-semibold text-slate-900">{t.admin.login}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Email va parolni kiriting, keyin authenticator kodi so'raladi.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Email yoki parol noto'g'ri. Qayta urinib ko'ring.
        </p>
      )}

      <form action={login} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="username"
            className="field"
            placeholder="admin@tezsotamiz.uz"
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            {t.admin.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
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
