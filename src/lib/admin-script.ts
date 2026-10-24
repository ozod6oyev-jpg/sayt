export type AdminScript = "lat" | "cyrl";

export const ADMIN_SCRIPT_COOKIE = "admin_script";

export const adminScriptOptions: { value: AdminScript; label: string }[] = [
  { value: "lat", label: "Lotin" },
  { value: "cyrl", label: "Кирилл" },
];

export type CopyPair<T extends Record<string, string>> = { lat: T; cyrl: T };
