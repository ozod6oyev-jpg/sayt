import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Eski havolalar yangi messenjer ko'rinishiga yo'naltiriladi */
export default async function InboxThreadRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/meta/xabarlar?chat=${encodeURIComponent(id)}`);
}
