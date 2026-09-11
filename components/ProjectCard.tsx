import Link from 'next/link';
import { ArrowUpRight, ExternalLink, Github, Star } from 'lucide-react';
import type { ProjectItem } from '@/lib/content';
import type { Dictionary, Locale } from '@/lib/i18n';
import { CoverPlaceholder } from '@/components/PostCard';

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  wip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  archived: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
};

export function ProjectCard({
  project,
  locale,
  dict,
}: {
  project: ProjectItem;
  locale: Locale;
  dict: Dictionary;
}) {
  const name = (locale === 'zh' ? project.nameZh : project.nameEn) || project.nameZh;
  const desc = (locale === 'zh' ? project.descZh : project.descEn) || project.descZh;
  const statusLabel = dict.projects.status[project.status as 'active' | 'wip' | 'archived'];

  return (
    <article className="card card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {project.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.cover}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <CoverPlaceholder title={name} />
        )}
        {project.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            <Star className="h-3 w-3 fill-current" />
            {locale === 'zh' ? '精选' : 'Featured'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug">
            <Link href={`/${locale}/projects/${project.slug}`} className="transition hover:text-brand-600 dark:hover:text-brand-300">
              {name}
            </Link>
          </h3>
          {statusLabel && (
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[project.status] ?? ''}`}>
              {statusLabel}
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted">{desc}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tech.slice(0, 5).map((tech) => (
            <span key={tech} className="badge badge-brand">
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-[rgb(var(--border))] pt-4">
          <Link
            href={`/${locale}/projects/${project.slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition hover:gap-1.5 dark:text-brand-300"
          >
            {dict.common.readMore}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer noopener"
                title={dict.projects.sourceCode}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[rgb(var(--border))] text-muted transition hover:text-brand-600"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noreferrer noopener"
                title={dict.projects.liveDemo}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[rgb(var(--border))] text-muted transition hover:text-brand-600"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
