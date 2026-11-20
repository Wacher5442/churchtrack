"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  {
    href: "/pastor/dashboard",
    label: "Tableau de bord",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/pastor/rapports",
    label: "Mes rapports",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

type Props = { userName: string };

export default function PastorTopNav({ userName }: Props) {
  const pathname = usePathname();
  const initials = userName.charAt(0).toUpperCase();

  return (
    /*
     * Mobile : shrink-0 dans le flex column du layout — pas de position fixed.
     * Desktop (sm+) : fixed top-0 pour rester au-dessus du contenu qui défile.
     */
    <header className="shrink-0 h-14 bg-white border-b border-neutral-200 flex items-center px-4 lg:px-8 sm:fixed sm:top-0 sm:left-0 sm:right-0 sm:z-30">
      {/* Logo */}
      <Link href="/pastor/dashboard" className="flex items-center gap-2.5 mr-8 shrink-0">
        <img src="/church.png" alt="ChurchTrack" width={28} height={28} />
        <span className="font-bold text-sm text-neutral-900">ChurchTrack</span>
      </Link>

      {/* Nav links — desktop only */}
      <nav className="hidden sm:flex items-center gap-1 flex-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <span className={active ? "text-primary" : "text-neutral-400"}>
                {item.icon(active)}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: user + logout */}
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
          <span className="text-sm font-medium text-neutral-700 max-w-[160px] truncate">{userName}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          aria-label="Déconnexion"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
