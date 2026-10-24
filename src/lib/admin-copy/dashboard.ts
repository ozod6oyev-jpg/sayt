import type { CopyPair } from "@/lib/admin-script";

const lat = {
  title: "Umumiy",
  newListing: "Yangi e'lon",
  newArticle: "Yangi maqola",
  all: "Barchasi →",
  listingsHeading: "E'lonlar",
  leadsHeading: "So'rovlar",
  listingsEmpty: "Hozircha e'lon yo'q.",
  leadsEmpty: "Hozircha so'rov yo'q.",
  statTotal: "Jami e'lonlar",
  statActive: "Faol e'lonlar",
  statViews: "Ko'rishlar",
  statLeads: "So'rovlar",
  statArticles: "Maqolalar",
  colTitle: "Sarlavha",
  colPrice: "Narx",
  colStatus: "Holat",
  colDate: "Sana",
  colName: "Ism",
  colPhone: "Telefon",
  colListing: "E'lon",
};

const cyrl: typeof lat = {
  title: "Умумий",
  newListing: "Янги эълон",
  newArticle: "Янги мақола",
  all: "Барчаси →",
  listingsHeading: "Эълонлар",
  leadsHeading: "Сўровлар",
  listingsEmpty: "Ҳозирча эълон йўқ.",
  leadsEmpty: "Ҳозирча сўров йўқ.",
  statTotal: "Жами эълонлар",
  statActive: "Фаол эълонлар",
  statViews: "Кўришлар",
  statLeads: "Сўровлар",
  statArticles: "Мақолалар",
  colTitle: "Сарлавҳа",
  colPrice: "Нарх",
  colStatus: "Ҳолат",
  colDate: "Сана",
  colName: "Исм",
  colPhone: "Телефон",
  colListing: "Эълон",
};

export const dashboardCopy: CopyPair<typeof lat> = { lat, cyrl };
