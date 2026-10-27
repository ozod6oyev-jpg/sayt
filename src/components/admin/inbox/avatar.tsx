import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
};

/** Profil rasmi bo'lmasa ko'rsatiladigan standart avatar */
const PLACEHOLDER = "/avatar-placeholder.svg";

export function InboxAvatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        loading="lazy"
        className={cn("shrink-0 rounded-full object-cover", SIZES[size], className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PLACEHOLDER}
      alt=""
      aria-hidden
      className={cn("shrink-0 rounded-full bg-slate-200 object-cover", SIZES[size], className)}
    />
  );
}
