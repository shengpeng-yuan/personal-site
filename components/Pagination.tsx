import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

/** 生成页码列表，超出部分用省略号占位 */
function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const result: (number | '…')[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push('…');
    result.push(page);
    previous = page;
  }
  return result;
}

export function Pagination({
  locale,
  page,
  totalPages,
  basePath,
  params = {},
}: {
  locale: Locale;
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function href(target: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set('page', String(target));
    const query = search.toString();
    return `/${locale}${basePath}${query ? `?${query}` : ''}`;
  }

  const pages = buildPages(page, totalPages);

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="pagination">
      <Link
        href={href(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={
          'grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] transition ' +
          (page === 1 ? 'pointer-events-none opacity-40' : 'hover:bg-black/5 dark:hover:bg-white/10')
        }
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pages.map((item, index) =>
        item === '…' ? (
          <span key={`gap-${index}`} className="px-1.5 text-sm text-muted">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            className={
              'grid h-9 min-w-9 place-items-center rounded-xl border px-2 text-sm font-medium transition ' +
              (item === page
                ? 'border-transparent bg-brand-600 text-white'
                : 'border-[rgb(var(--border))] hover:bg-black/5 dark:hover:bg-white/10')
            }
          >
            {item}
          </Link>
        ),
      )}

      <Link
        href={href(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={
          'grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] transition ' +
          (page === totalPages
            ? 'pointer-events-none opacity-40'
            : 'hover:bg-black/5 dark:hover:bg-white/10')
        }
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
