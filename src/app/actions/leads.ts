"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function safeReturnTo(value: string): string {
  // Faqat sayt ichidagi yo'llarga ruxsat (open redirect himoyasi)
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/uz/elonlar";
}

export async function submitLead(formData: FormData): Promise<void> {
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/uz/elonlar"));

  // Oddiy bot himoyasi: yashirin maydon to'ldirilgan bo'lsa, jim o'tkazib yuboramiz
  if (String(formData.get("company") ?? "").length > 0) {
    redirect(returnTo);
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const listingIdRaw = String(formData.get("listingId") ?? "").trim();

  const digits = phone.replace(/\D/g, "");

  if (name.length < 2 || digits.length < 7 || name.length > 100 || phone.length > 30) {
    redirect(`${returnTo}?lead=error#aloqa`);
  }

  let listingId: string | null = null;
  if (listingIdRaw) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingIdRaw },
      select: { id: true },
    });
    listingId = listing?.id ?? null;
  }

  await prisma.lead.create({
    data: {
      name: name.slice(0, 100),
      phone: phone.slice(0, 30),
      message: message ? message.slice(0, 1000) : null,
      listingId,
    },
  });

  redirect(`${returnTo}?lead=sent#aloqa`);
}
