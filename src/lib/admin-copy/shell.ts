import type { CopyPair } from "@/lib/admin-script";

const lat = {
  panel: "Boshqaruv paneli",
  dashboard: "Umumiy",
  listings: "E'lonlar",
  saleOptions: "Sotuv variantlari",
  articles: "Maqolalar",
  leads: "So'rovlar",
  users: "Adminlar",
  profile: "Profil",
  viewSite: "Saytni ko'rish",
  logout: "Chiqish",
  switchHint: "Panel tili",
  owner: "Owner",
  adminRole: "Admin",
};

const cyrl: typeof lat = {
  panel: "Бошқарув панели",
  dashboard: "Умумий",
  listings: "Эълонлар",
  saleOptions: "Сотув вариантлари",
  articles: "Мақолалар",
  leads: "Сўровлар",
  users: "Админлар",
  profile: "Профил",
  viewSite: "Сайтни кўриш",
  logout: "Чиқиш",
  switchHint: "Панел тили",
  owner: "Эгаси",
  adminRole: "Админ",
};

export const shellCopy: CopyPair<typeof lat> = { lat, cyrl };
