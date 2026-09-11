import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Eye, FileText, FolderGit2, MapPin } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { ProjectCard } from '@/components/ProjectCard';
import { getFeaturedPosts, getProjects, getSiteStats } from '@/lib/content';
import { getDictionary, isLocale } from '@/lib/i18n';
import { getSettings, localizeSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const settings = await getSettings();
  const localized = localizeSettings(settings, locale);
  const [posts, projects, stats] = await Promise.all([
    getFeaturedPosts(3),
    getProjects(),
    getSiteStats(),
  ]);

  const featuredProjects = [
    ...projects.filter((project) => project.featured),
    ...projects.filter((project) => !project.featured),
  ].slice(0, 3);

  const intro = localized.bio.split('\n').filter(Boolean)[0] ?? '';
  const initial = localized.author.trim().charAt(0).toUpperCase() || 'A';

  const statItems = [
    { icon: FileText, value: stats.posts, label: dict.home.stats.posts },
    { icon: FolderGit2, value: stats.projects, label: dict.home.stats.projects },
    { icon: Eye, value: stats.views, label: dict.home.stats.views },
  ];

  return (
    <div>
      {/* 首屏 */}
      <section className="relative overflow-hidden">
        <div className="aurora-bg">
          <div className="aurora-blob -left-24 -top-24 h-72 w-72 animate-aurora bg-brand-500" />
          <div className="aurora-blob right-0 top-10 h-80 w-80 animate-aurora bg-violet-500 [animation-delay:-6s]" />
          <div className="aurora-blob bottom-0 left-1/3 h-64 w-64 animate-aurora bg-cyan-400 [animation-delay:-12s]" />
        </div>

        <div className="container relative py-16 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="animate-fade-up">
              <span className="badge badge-brand">
                {dict.home.greeting}
                {localized.location ? ` · ${localized.location}` : ''}
              </span>

              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                <span className="gradient-text">{localized.author}</span>
              </h1>

              <p className="mt-4 text-lg font-medium text-muted sm:text-xl">{localized.tagline}</p>
              <p className="mt-6 max-w-xl leading-7 text-muted">{intro}</p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={`/${locale}/blog`} className="btn btn-primary">
                  {dict.home.ctaBlog}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={`/${locale}/projects`} className="btn btn-ghost">
                  {dict.home.ctaProjects}
                </Link>
              </div>

              <dl className="mt-12 grid max-w-md grid-cols-3 gap-4">
                {statItems.map(({ icon: Icon, value, label }) => (
                  <div key={label} className="card p-4">
                    <Icon className="h-4 w-4 text-brand-500" />
                    <dd className="mt-2 text-2xl font-bold tabular-nums">{value}</dd>
                    <dt className="mt-0.5 text-xs text-muted">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* 头像卡片 */}
            <div className="relative mx-auto w-full max-w-sm animate-fade-up [animation-delay:120ms]">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-500/20 via-violet-500/10 to-cyan-400/20 blur-2xl" />
              <div className="card relative overflow-hidden p-6">
                <div className="mx-auto grid h-32 w-32 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-violet-500 text-4xl font-bold text-white shadow-glow">
                  {settings.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.avatar} alt={localized.author} className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>

                <div className="mt-5 text-center">
                  <div className="text-lg font-semibold">{localized.author}</div>
                  {localized.location && (
                    <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                      <MapPin className="h-3.5 w-3.5" />
                      {localized.location}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                  {settings.skills.slice(0, 6).map((skill) => (
                    <span key={skill} className="badge">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 最新文章 */}
      {posts.length > 0 && (
        <section className="container py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">{dict.home.latestPosts}</h2>
              <p className="mt-2 text-sm text-muted">{dict.blog.subtitle}</p>
            </div>
            <Link
              href={`/${locale}/blog`}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600 transition hover:gap-1.5 dark:text-brand-300"
            >
              {dict.common.viewAll}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* 精选项目 */}
      {featuredProjects.length > 0 && (
        <section className="container py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">{dict.home.featuredProjects}</h2>
              <p className="mt-2 text-sm text-muted">{dict.projects.subtitle}</p>
            </div>
            <Link
              href={`/${locale}/projects`}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600 transition hover:gap-1.5 dark:text-brand-300"
            >
              {dict.common.viewAll}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} locale={locale} dict={dict} />
            ))}
          </div>
        </section>
      )}

      {/* 技能栈 */}
      {settings.skills.length > 0 && (
        <section className="container py-16">
          <h2 className="section-title">{dict.home.skills}</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {settings.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-xl border border-[rgb(var(--border))] px-3.5 py-2 text-sm font-medium transition hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
