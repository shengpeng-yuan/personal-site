'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Languages } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/lib/i18n';

export function LangSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(target: Locale) {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && (locales as readonly string[]).includes(segments[0])) {
      segments[0] = target;
    } else {
      segments.unshift(target);
    }
    const query = searchParams.toString();
    return `/${segments.join('/')}${query ? `?${query}` : ''}`;
  }

  return (
    <div
      className="flex items-center gap-1 rounded-xl border border-[rgb(var(--border))] p-1"
      aria-label={label}
    >
      <Languages className="ml-1.5 h-3.5 w-3.5 text-muted" />
      {locales.map((locale) => (
        <Link
          key={locale}
          href={buildHref(locale)}
          className={
            'rounded-lg px-2 py-1 text-xs font-medium transition ' +
            (locale === current
              ? 'bg-brand-600 text-white'
              : 'text-muted hover:bg-black/5 dark:hover:bg-white/10')
          }
        >
          {localeNames[locale]}
        </Link>
      ))}
    </div>
  );
}
