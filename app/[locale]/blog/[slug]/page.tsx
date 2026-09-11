import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Eye } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { PostCard } from '@/components/PostCard';
import { ViewTracker } from '@/components/ViewTracker';
import { getAdjacentPosts, getPostBySlug, getRelatedPosts } from '@/lib/content';
import { getDictionary, isLocale } from '@/lib/i18n';
import { formatDate, parseList, readingTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function pick(locale: string, zh: string, en: string) {
  return (locale === 'zh' ? zh : en) || zh || en;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Not found' };

  const title = pick(locale, post.titleZh, post.titleEn);
  const description = pick(locale, post.excerptZh, post.excerptEn);

  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const dict = getDictionary(locale);
  const title = pick(locale, post.titleZh, post.titleEn);
  const content = pick(locale, post.contentZh, post.contentEn);
  const tags = parseList(post.tags);

  const [adjacent, related] = await Promise.all([
    getAdjacentPosts(post.publishedAt, post.id),
    getRelatedPosts(slug, tags),
  ]);

  const minutes = readingTime(content, locale);

  return (
    <div className="container py-10 sm:py-14">
      <ViewTracker postId={post.id} />

      <Link
        href={`/${locale}/blog`}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-brand-600 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        {dict.blog.allPosts}
      </Link>

      <article className="mx-auto mt-8 max-w-3xl">
        <header>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link key={tag} href={`/${locale}/blog?tag=${encodeURIComponent(tag)}`} className="badge badge-brand">
                #{tag}
              </Link>
            ))}
          </div>

          <h1 className="mt-5 text-3xl font-bold leading-snug tracking-tight sm:text-4xl">{title}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            {post.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatDate(post.publishedAt, locale)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {minutes} {dict.common.minRead}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {post.views} {dict.common.views}
            </span>
          </div>

          {post.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover}
              alt={title}
              className="mt-8 w-full rounded-2xl border border-[rgb(var(--border))] object-cover"
            />
          )}
        </header>

        <div className="mt-10">
          <Markdown content={content} />
        </div>

        {/* 上一篇 / 下一篇 */}
        {(adjacent.prev || adjacent.next) && (
          <nav className="mt-14 grid gap-4 border-t border-[rgb(var(--border))] pt-8 sm:grid-cols-2">
            {adjacent.prev ? (
              <Link href={`/${locale}/blog/${adjacent.prev.slug}`} className="card card-hover group p-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {dict.common.prev}
                </span>
                <p className="mt-2 line-clamp-2 text-sm font-medium transition group-hover:text-brand-600 dark:group-hover:text-brand-300">
                  {pick(locale, adjacent.prev.titleZh, adjacent.prev.titleEn)}
                </p>
              </Link>
            ) : (
              <span />
            )}

            {adjacent.next && (
              <Link
                href={`/${locale}/blog/${adjacent.next.slug}`}
                className="card card-hover group p-4 text-right sm:col-start-2"
              >
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  {dict.common.next}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <p className="mt-2 line-clamp-2 text-sm font-medium transition group-hover:text-brand-600 dark:group-hover:text-brand-300">
                  {pick(locale, adjacent.next.titleZh, adjacent.next.titleEn)}
                </p>
              </Link>
            )}
          </nav>
        )}
      </article>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-5xl">
          <h2 className="section-title">{dict.common.relatedPosts}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <PostCard key={item.id} post={item} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
