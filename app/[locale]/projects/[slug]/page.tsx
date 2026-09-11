import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Github } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { ProjectCard } from '@/components/ProjectCard';
import { getProjectBySlug, getProjects } from '@/lib/content';
import { getDictionary, isLocale } from '@/lib/i18n';

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
  const project = await getProjectBySlug(slug);
  if (!project) return { title: 'Not found' };

  return {
    title: pick(locale, project.nameZh, project.nameEn),
    description: pick(locale, project.descZh, project.descEn),
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const dict = getDictionary(locale);
  const name = pick(locale, project.nameZh, project.nameEn);
  const desc = pick(locale, project.descZh, project.descEn);
  const content = pick(locale, project.contentZh, project.contentEn);
  const statusLabel = dict.projects.status[project.status as 'active' | 'wip' | 'archived'];

  const others = (await getProjects())
    .filter((item) => item.slug !== project.slug)
    .slice(0, 3);

  return (
    <div className="container py-10 sm:py-14">
      <Link
        href={`/${locale}/projects`}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-brand-600 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        {dict.projects.title}
      </Link>

      <article className="mx-auto mt-8 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          {statusLabel && <span className="badge badge-brand">{statusLabel}</span>}
          {project.tech.map((item) => (
            <span key={item} className="badge">
              {item}
            </span>
          ))}
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
        {desc && <p className="mt-4 leading-7 text-muted">{desc}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noreferrer noopener" className="btn btn-primary">
              <ExternalLink className="h-4 w-4" />
              {dict.projects.liveDemo}
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer noopener" className="btn btn-ghost">
              <Github className="h-4 w-4" />
              {dict.projects.sourceCode}
            </a>
          )}
        </div>

        {project.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.cover}
            alt={name}
            className="mt-8 w-full rounded-2xl border border-[rgb(var(--border))] object-cover"
          />
        )}

        {content && (
          <div className="mt-10 border-t border-[rgb(var(--border))] pt-10">
            <Markdown content={content} />
          </div>
        )}
      </article>

      {others.length > 0 && (
        <section className="mx-auto mt-16 max-w-5xl">
          <h2 className="section-title">{dict.projects.title}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((item) => (
              <ProjectCard key={item.id} project={item} locale={locale} dict={dict} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
