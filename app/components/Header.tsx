"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "./ui/Button";
import ThemeToggle from "./ThemeToggle";
import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Logo from "@/app/assets/IDKDO.png";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const firstLinkRef = React.useRef<HTMLAnchorElement | null>(null);

  React.useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
      setTimeout(() => firstLinkRef.current?.focus(), 0);
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const navigation = [
    { name: "Tableau de bord", href: "/dashboard", icon: "🏠" },
    { name: "Ma liste", href: "/my-list", icon: "🎁" },
    { name: "Groupes", href: "/groups", icon: "👥" },
  { name: "Mon profil", href: "/profile", icon: "👤" },
  ];

  return (
  <header className="sticky top-0 z-50 bg-[var(--background)] backdrop-blur-md border-b border-[var(--border)]" role="navigation" aria-label="Navigation principale">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center text-[var(--foreground)] hover:text-[var(--primary)] transition-colors" aria-label="Accueil IDKDO">
            <div className="w-32 h-16 rounded-lg overflow-hidden relative">
              <Image src={Logo} alt="IDKDO" fill className="object-contain" priority />
            </div>
            <span className="sr-only">IDKDO</span>
          </Link>

          {/* Desktop Navigation (button-like) */}
          <nav className="hidden md:flex items-center gap-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 shadow-sm border ${
                    isActive
                      ? "bg-[var(--primary)] text-white border-[var(--primary-hover)] hover:bg-[var(--primary-hover)]"
                      : "bg-[var(--card-bg)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--surface)]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Theme + Mobile burger */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              className="md:hidden h-10 w-10 p-0"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="text-lg">{open ? "✕" : "☰"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (portaled to body so it overlays the whole page) */}
      {open && typeof window !== "undefined" && createPortal(
        <div className="md:hidden fixed inset-0 z-[100]" role="dialog" aria-modal="true">
          <button aria-label="Fermer" className="absolute inset-0 z-10" style={{ background: 'var(--overlay)' }} onClick={() => setOpen(false)} />
          <div className="relative z-20 ml-auto h-full w-[85%] max-w-sm bg-[var(--background)] border-l border-[var(--border)] shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                <span className="w-10 h-10 rounded-lg inline-flex overflow-hidden relative">
                  <Image src={Logo} alt="IDKDO" fill className="object-contain" />
                </span>
                Menu
              </div>
              <Button variant="ghost" size="sm" aria-label="Fermer" onClick={() => setOpen(false)}>✕</Button>
            </div>
            <div className="p-4 grid grid-cols-1 gap-3">
              {navigation.map((item, idx) => {
                const isActive = pathname === item.href;
                const color = idx === 0 ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)]" : idx === 1 ? "bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]" : "bg-[var(--accent)] hover:bg-[var(--accent-hover)]";
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    ref={idx === 0 ? firstLinkRef : null}
                    className={`active:scale-[0.98] transition-transform rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]`}
                    onClick={() => setOpen(false)}
                  >
                    <div className={`flex items-center gap-3 p-4 text-white ${color} ${isActive ? 'ring-2 ring-white/30' : ''}`}>
                      <div className="text-xl">{item.icon}</div>
                      <div className="font-semibold text-base">{item.name}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
