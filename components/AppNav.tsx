"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";
import type { User } from "@/types";

interface AppNavProps {
  user: User;
}

const links = [
  { href: "/rooms", label: "Phòng" },
  { href: "/balances", label: "Sổ nợ" },
  { href: "/history", label: "Lịch sử" },
];

export default function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link
            href="/rooms"
            className="truncate text-base font-bold text-emerald-700 sm:text-lg"
          >
            <span className="sm:hidden">Catte</span>
            <span className="hidden sm:inline">Catte Ledger</span>
          </Link>
          <nav className="hidden gap-4 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  pathname.startsWith(link.href)
                    ? "text-emerald-700"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <span
            className="hidden max-w-[120px] truncate text-sm text-zinc-600 md:inline dark:text-zinc-400"
            title={user.display_name}
          >
            {user.display_name}
          </span>
          <NotificationBell user={user} />
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-50 sm:px-3 sm:py-1.5 sm:text-sm dark:border-zinc-600 dark:hover:bg-zinc-800"
            aria-label="Đăng xuất"
          >
            <svg
              className="h-5 w-5 sm:hidden"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}
