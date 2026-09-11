import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FolderGit2 } from 'lucide-react';
import { ProjectCard } from '@/components/ProjectCard';
import { getProjects } from '@/lib/content';
import { getDictionary, isLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tech?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { tech } = await searchParams;
  const dict = getDictionary(locale);
  const projects = await getProjects();

  const techs = [...new Set(projects.flatMap((project) => project.tech))].sort();
  const visible = tech ? projects.filter((project) => project.tech.includes(tech)) : projects;

  return (
    <div className="container py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{dict.projects.title}</h1>
        <p className="mt-3 text-muted">{dict.projects.subtitle}</p>
      </header>

      {techs.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Link
            href={`/${locale}/projects`}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
              !tech
                ? 'border-transparent bg-brand-600 text-white'
                : 'border-[rgb(var(--border))] text-muted hover:text-brand-600',
            )}
          >
            {dict.projects.all}
          </Link>
          {techs.map((item) => (
            <Link
              key={item}
              href={`/${locale}/projects?tech=${encodeURIComponent(item)}`}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                tech === item
                  ? 'border-transparent bg-brand-600 text-white'
                  : 'border-[rgb(var(--border))] text-muted hover:text-brand-600',
              )}
            >
              {item}
            </Link>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center justify-center gap-3 py-20 text-center">
          <FolderGit2 className="h-8 w-8 text-muted" />
          <p className="text-muted">{dict.common.noResult}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} locale={locale} dict={dict} />
          ))}
        </div>
      )}
    </div>
  );
}
