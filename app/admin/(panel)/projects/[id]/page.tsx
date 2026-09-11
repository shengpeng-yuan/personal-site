import { notFound } from 'next/navigation';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { prisma } from '@/lib/prisma';
import { parseList } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const project = await prisma.project.findUnique({ where: { id: numericId } });
  if (!project) notFound();

  return (
    <ProjectForm
      initial={{
        id: project.id,
        slug: project.slug,
        nameZh: project.nameZh,
        nameEn: project.nameEn,
        descZh: project.descZh,
        descEn: project.descEn,
        contentZh: project.contentZh,
        contentEn: project.contentEn,
        cover: project.cover ?? '',
        tech: parseList(project.tech),
        repoUrl: project.repoUrl ?? '',
        demoUrl: project.demoUrl ?? '',
        status: project.status,
        featured: project.featured,
        order: project.order,
      }}
    />
  );
}
