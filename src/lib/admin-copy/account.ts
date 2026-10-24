import type { CopyPair } from "@/lib/admin-script";

const lat = {
  // Profil
  profileTitle: "Profil",
  profileSubtitle: "Hisob ma'lumotlari, parol va Google Authenticator kaliti.",
  setupTitle: "Owner hisobi yaratildi 🎉",
  setupText:
    "Endi quyidagi kalitni Google Authenticator'ga qo'shing. Keyingi safar kirishda shu ilovadagi 6 xonali kod so'raladi. Kalitni xavfsiz joyda saqlang.",
  savedPassword: "Parol yangilandi.",
  savedTotp:
    "Yangi authenticator kaliti yaratildi. Eskisi endi ishlamaydi — yangisini ilovaga qo'shing.",
  errCurrent: "Joriy parol noto'g'ri.",
  errWeak: "Yangi parol kamida 8 belgidan iborat bo'lsin.",
  errMatch: "Yangi parollar mos kelmadi.",
  accountSection: "Hisob",
  nameLabel: "Ism",
  emailLabel: "Email",
  roleLabel: "Rol",
  roleOwner: "Owner",
  roleAdmin: "Admin",
  lastLoginLabel: "Oxirgi kirish",
  authenticatorTitle: "Google Authenticator",
  authenticatorHint:
    "Ilovada «+» → «Kirish kodi» → «Kalitni qo'lda kiritish» ni tanlab, quyidagi kalitni kiriting (bo'shliqlarsiz).",
  secretLabel: "Maxfiy kalit",
  otpauthLabel: "otpauth havolasi",
  otpauthHint: "Telefonda bu havolani bosish authenticator ilovasini ochadi.",
  newKey: "Yangi kalit yaratish",
  newKeyWarning: "Diqqat: eski kalit ishlamay qoladi.",
  changePassword: "Parolni almashtirish",
  currentPassword: "Joriy parol",
  newPassword: "Yangi parol",
  repeatPassword: "Takrorlang",
  save: "Saqlash",

  // Sotuv variantlari
  optionsTitle: "Sotuv variantlari",
  optionsHint:
    "E'lon formasida tanlanadigan sotuv shartlari. Masalan: Naqd, Ipoteka. Har bir variant alohida e'lon uchun tanlanadi.",
  errRequired: "Ikkala tildagi nomni kiriting.",
  errGeneric: "Xatolik yuz berdi. Qayta urinib ko'ring.",
  savedNotice: "Saqlandi.",
  newOption: "Yangi variant",
  fieldNameUz: "Nomi (o'zbekcha)",
  fieldNameRu: "Nomi (ruscha)",
  fieldSort: "Tartib raqami",
  active: "Faol",
  placeholderUz: "Naqd",
  placeholderRu: "Наличные",
  empty: "Hozircha variant qo'shilmagan.",
  listingsCount: "{n} ta e'lon",
  delete: "O'chirish",
  footnote:
    "Variant o'chirilsa, unga bog'langan e'lonlarda variant belgisi bo'sh qoladi — e'lonlar o'chmaydi.",
};

const cyrl: typeof lat = {
  // Profil
  profileTitle: "Профил",
  profileSubtitle: "Ҳисоб маълумотлари, парол ва Google Authenticator калити.",
  setupTitle: "Эга ҳисоби яратилди 🎉",
  setupText:
    "Энди қуйидаги калитни Google Authenticator'га қўшинг. Кейинги сафар киришда шу иловадаги 6 хонали код сўралади. Калитни хавфсиз жойда сақланг.",
  savedPassword: "Парол янгиланди.",
  savedTotp:
    "Янги аутентификатор калити яратилди. Эскиси энди ишламайди — янгисини иловага қўшинг.",
  errCurrent: "Жорий парол нотўғри.",
  errWeak: "Янги парол камида 8 белгидан иборат бўлсин.",
  errMatch: "Янги пароллар мос келмади.",
  accountSection: "Ҳисоб",
  nameLabel: "Исм",
  emailLabel: "Email",
  roleLabel: "Рол",
  roleOwner: "Эгаси",
  roleAdmin: "Админ",
  lastLoginLabel: "Охирги кириш",
  authenticatorTitle: "Google Authenticator",
  authenticatorHint:
    "Иловада «+» → «Кириш коди» → «Калитни қўлда киритиш» ни танлаб, қуйидаги калитни киритинг (бўшлиқларсиз).",
  secretLabel: "Махфий калит",
  otpauthLabel: "otpauth ҳаволаси",
  otpauthHint: "Телефонда бу ҳаволани босиш аутентификатор иловасини очади.",
  newKey: "Янги калит яратиш",
  newKeyWarning: "Диққат: эски калит ишламай қолади.",
  changePassword: "Паролни алмаштириш",
  currentPassword: "Жорий парол",
  newPassword: "Янги парол",
  repeatPassword: "Такрорланг",
  save: "Сақлаш",

  // Sotuv variantlari
  optionsTitle: "Сотув вариантлари",
  optionsHint:
    "Эълон формасида танланадиган сотув шартлари. Масалан: Нақд, Ипотека. Ҳар бир вариант алоҳида эълон учун танланади.",
  errRequired: "Иккала тилдаги номни киритинг.",
  errGeneric: "Хатолик юз берди. Қайта уриниб кўринг.",
  savedNotice: "Сақланди.",
  newOption: "Янги вариант",
  fieldNameUz: "Номи (ўзбекча)",
  fieldNameRu: "Номи (русча)",
  fieldSort: "Тартиб рақами",
  active: "Фаол",
  placeholderUz: "Нақд",
  placeholderRu: "Наличные",
  empty: "Ҳозирча вариант қўшилмаган.",
  listingsCount: "{n} та эълон",
  delete: "Ўчириш",
  footnote:
    "Вариант ўчирилса, унга боғланган эълонларда вариант белгиси бўш қолади — эълонлар ўчмайди.",
};

export const accountCopy: CopyPair<typeof lat> = { lat, cyrl };
