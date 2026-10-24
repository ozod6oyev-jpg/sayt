import Link from "next/link";
import { createAdmin } from "@/app/actions/users";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ERRORS: Record<string, string> = {
  fields: "Ism, to'g'ri email va kamida 8 belgili parol kiriting.",
  match: "Parollar mos kelmadi.",
  email: "Bu email allaqachon ro'yxatdan o'tgan.",
  notfound: "Admin topilmadi.",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default async function UsersPage({ searchParams }: PageProps) {
  await requireOwner();

  const query = await searchParams;
  const error = first(query.error);
  const created = first(query.created);

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Adminlar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Yangi admin qo'shsangiz, unga kirish uchun email, parol va authenticator kaliti
          beriladi.
        </p>
      </div>

      {error && ERRORS[error] && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{ERRORS[error]}</p>
      )}

      {created === "1" && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Admin yaratildi. Kalitni nusxalab, adminga yuboring.
        </p>
      )}

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Mavjud adminlar</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Ism</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Holat</th>
                <th className="px-4 py-2 font-medium">Oxirgi kirish</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-2 font-medium text-slate-800">{user.name}</td>
                  <td className="px-4 py-2 text-slate-600">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className="badge">{user.role === "owner" ? "Owner" : "Admin"}</span>
                  </td>
                  <td className="px-4 py-2">
                    {user.isActive ? (
                      <span className="text-xs font-medium text-brand-700">Faol</span>
                    ) : (
                      <span className="text-xs font-medium text-red-600">Bloklangan</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs whitespace-nowrap text-slate-500">
                    {formatDateTime(user.lastLoginAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-xs font-medium text-brand-700 hover:underline"
                    >
                      Boshqarish
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">Yangi admin qo'shish</h2>
        <p className="mt-1 text-xs text-slate-500">
          Authenticator kaliti avtomatik yaratiladi va keyingi sahifada ko'rsatiladi.
        </p>

        <form action={createAdmin} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              Ism familiya
            </label>
            <input id="name" name="name" required minLength={2} className="field" />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email (login)
            </label>
            <input id="email" name="email" type="email" required className="field" />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Vaqtinchalik parol
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

          <div>
            <label className="label" htmlFor="role">
              Rol
            </label>
            <select id="role" name="role" defaultValue="admin" className="field">
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn-primary">
              Admin yaratish
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
