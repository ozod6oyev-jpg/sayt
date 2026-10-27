"use client";

import Link from "next/link";
import { ChevronDown, ExternalLink, LogOut, UserRound } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminUserMenu({
  name,
  roleLabel,
  logoutLabel,
  viewSiteLabel,
  profileLabel,
}: {
  name: string;
  roleLabel: string;
  logoutLabel: string;
  viewSiteLabel: string;
  profileLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-border bg-background py-0.5 pr-1.5 pl-0.5 transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40"
          aria-label={name}
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-brand-800 text-[10px]">{initials(name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-left leading-tight md:block">
            <span className="block max-w-[140px] truncate text-xs font-semibold text-foreground">
              {name}
            </span>
            <span className="hidden text-[10px] text-muted-foreground lg:block">{roleLabel}</span>
          </span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate text-foreground">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/uz">
            <ExternalLink className="size-4 text-muted-foreground" />
            {viewSiteLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/profil">
            <UserRound className="size-4 text-muted-foreground" />
            {profileLabel}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut className="size-4" />
              {logoutLabel}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
