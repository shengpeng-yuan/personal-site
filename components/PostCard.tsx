import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Eye } from 'lucide-react';
import type { PostSummary } from '@/lib/content';
import type { Locale } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';

function titleOf(post: PostSummary, locale: Locale) {
  return (locale === 'zh' ? post.titleZh : post.titleEn) || post.titleZh || post.titleEn;
}

function excerptOf(post: PostSummary, locale: Locale) {
  return (locale === 'zh' ? post.excerptZh : post.excerptEn) || post.excerptZh || post.excerptEn;
}

export function CoverPlaceholder({ title }: { title: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-brand-500/85 via-violet-500/80 to-cyan-400/80">
      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-10 -left-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <span className="absolute bottom-3 left-4 max-w-[80%] truncate text-sm font-semibold text-white/95">
        {title}
      </span>
    </div>
  );
}

export function PostCard({ post, locale }: { post: PostSummary; locale: Locale }) {
  const title = titleOf(post, locale);
  const excerpt = excerptOf(post, locale);

  return (
    <article className="card card-hover group overflow-hidden">
      <Link href={`/${locale}/blog/${post.slug}`} className="block">
        <div className="aspect-[16/9] w-full overflow-hidden">
          {post.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <CoverPlaceholder title={title} />
          )}
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {post.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(post.publishedAt, locale)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {post.views}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug transition group-hover:text-brand-600 dark:group-hover:text-brand-300">
            {title}
          </h3>
          {excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{excerpt}</p>}

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="badge">
                  #{tag}
                </span>
              ))}
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
          </div>
        </div>
      </Link>
    </article>
  );
}
