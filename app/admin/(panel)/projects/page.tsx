import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ProjectsTable, type ProjectRow } from '@/components/admin/ProjectsTable';
import { prisma } from '@/lib/prisma';
import { parseList } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      nameZh: true,
      nameEn: true,
      tech: true,
      status: true,
      featured: true,
      order: true,
    },
  });

  const items: ProjectRow[] = projects.map((project) => ({
    ...project,
    tech: parseList(project.tech),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">项目管理</h1>
          <p className="mt-1.5 text-sm text-muted">展示你的作品与技术实践</p>
        </div>
        <Link href="/admin/projects/new" className="btn btn-primary btn-sm">
          <Plus className="h-3.5 w-3.5" />
          新建项目
        </Link>
      </header>

      <div className="mt-6">
        <ProjectsTable items={items} />
      </div>
    </div>
  );
}
