import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileSearch, Plus } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { PostCard } from '@/components/PostCard';
import { SearchBar } from '@/components/SearchBar';
import { getPostTags, queryPosts } from '@/lib/content';
import { getDictionary, isLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 6;

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; tag?: string; q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { page: pageParam, tag, q } = await searchParams;
  const dict = getDictionary(locale);

  const [result, tags] = await Promise.all([
    queryPosts({
      tag,
      q,
      page: Number(pageParam) || 1,
      pageSize: PAGE_SIZE,
    }),
    getPostTags(),
  ]);

  function tagHref(nextTag?: string) {
    const search = new URLSearchParams();
    if (nextTag) search.set('tag', nextTag);
    if (q) search.set('q', q);
    const query = search.toString();
    return `/${locale}/blog${query ? `?${query}` : ''}`;
  }

  const totalLabel = dict.blog.totalPosts.replace('{count}', String(result.total));

  return (
    <div className="container py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{dict.blog.title}</h1>
        <p className="mt-3 text-muted">{dict.blog.subtitle}</p>
      </header>

      <div className="mt-8 max-w-xl">
        <SearchBar locale={locale} dict={dict} defaultValue={q ?? ''} />
      </div>

      {tags.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href={tagHref()}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
              !tag
                ? 'border-transparent bg-brand-600 text-white'
                : 'border-[rgb(var(--border))] text-muted hover:text-brand-600',
            )}
          >
            {dict.common.allTags}
          </Link>
          {tags.map((item) => (
            <Link
              key={item.name}
              href={tagHref(item.name)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                tag === item.name
                  ? 'border-transparent bg-brand-600 text-white'
                  : 'border-[rgb(var(--border))] text-muted hover:text-brand-600',
              )}
            >
              #{item.name}
              <span className="ml-1.5 opacity-60">{item.count}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-4 text-sm text-muted">
        <span>
          {q ? (
            <>
              {dict.common.search}：<span className="font-medium text-[rgb(var(--fg))]">{q}</span>
            </>
          ) : tag ? (
            <>
              {dict.blog.taggedWith}
              <span className="font-medium text-[rgb(var(--fg))]">#{tag}</span>
            </>
          ) : (
            dict.blog.allPosts
          )}
        </span>
        <span>{totalLabel}</span>
      </div>

      {result.items.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center justify-center gap-3 py-20 text-center">
          <FileSearch className="h-8 w-8 text-muted" />
          <p className="text-muted">{dict.common.noResult}</p>
          <Link href={`/${locale}/blog`} className="btn btn-ghost btn-sm mt-2">
            <Plus className="h-3.5 w-3.5" />
            {dict.blog.allPosts}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      )}

      <Pagination
        locale={locale}
        page={result.page}
        totalPages={result.totalPages}
        basePath="/blog"
        params={{ tag, q }}
      />
    </div>
  );
}
