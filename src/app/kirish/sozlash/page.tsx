import Image from "next/image";
import { redirect } from "next/navigation";
import { setupOwner } from "@/app/actions/auth";
import { siteName } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ERRORS: Record<string, string> = {
  key: "Sozlash kaliti noto'g'ri. .env fayldagi ADMIN_PASSWORD ni tekshiring.",
  fields: "Ism, to'g'ri email va kamida 8 belgili parol kiriting.",
  match: "Parollar mos kelmadi.",
  email: "Bu email allaqachon ro'yxatdan o'tgan.",
};

export default async function SetupPage({ searchParams }: PageProps) {
  if ((await prisma.adminUser.count()) > 0) {
    redirect("/kirish");
  }

  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const message = error ? ERRORS[error] : null;

  return (
    <div className="card w-full max-w-md p-8">
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
          <p className="text-xs text-slate-500">Birinchi sozlash</p>
        </div>
      </div>

      <h1 className="text-lg font-semibold text-slate-900">Owner hisobini yarating</h1>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Bu hisob boshqa adminlarni qo'shadi va ularga authenticator kalitlarini beradi.
        Sozlash kaliti — serverdagi <code className="rounded bg-slate-100 px-1">.env</code>{" "}
        faylidagi <code className="rounded bg-slate-100 px-1">ADMIN_PASSWORD</code> qiymati.
      </p>

      {message && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
      )}

      <form action={setupOwner} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="setupKey">
            Sozlash kaliti
          </label>
          <input
            id="setupKey"
            name="setupKey"
            type="password"
            required
            autoComplete="off"
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="name">
            Ism familiya
          </label>
          <input id="name" name="name" required minLength={2} className="field" />
        </div>

        <div>
          <label className="label" htmlFor="email">
            Email (login uchun)
          </label>
          <input id="email" name="email" type="email" required className="field" />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Parol (kamida 8 belgi)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="confirm">
            Parolni takrorlang
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          Owner yaratish
        </button>
      </form>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        Hisob yaratilgach authenticator kaliti ko'rsatiladi — uni Google Authenticator'ga
        qo'shib qo'ying.
      </p>
    </div>
  );
}
