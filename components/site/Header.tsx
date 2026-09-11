'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sparkles, X } from 'lucide-react';
import { LangSwitcher } from '@/components/LangSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Dictionary, Locale } from '@/lib/i18n';

type Props = {
  locale: Locale;
  dict: Dictionary;
  siteTitle: string;
};

export function Header({ locale, dict, siteTitle }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/blog`, label: dict.nav.blog },
    { href: `/${locale}/projects`, label: dict.nav.projects },
    { href: `/${locale}/about`, label: dict.nav.about },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    const exact = `/${locale}`;
    return href === exact ? pathname === exact : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[rgb(var(--border))] glass">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href={`/${locale}`} className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-glow">
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">{siteTitle}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                'rounded-xl px-3.5 py-2 text-sm font-medium transition ' +
                (isActive(item.href)
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                  : 'text-muted hover:bg-black/5 hover:text-[rgb(var(--fg))] dark:hover:bg-white/10')
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LangSwitcher current={locale} label={dict.common.language} />
          </div>
          <ThemeToggle label={dict.common.theme} />
          <button
            type="button"
            aria-label="menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[rgb(var(--border))] md:hidden">
          <div className="container flex flex-col gap-1 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'rounded-xl px-3 py-2.5 text-sm font-medium transition ' +
                  (isActive(item.href)
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                    : 'text-muted hover:bg-black/5 dark:hover:bg-white/10')
                }
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 sm:hidden">
              <LangSwitcher current={locale} label={dict.common.language} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
