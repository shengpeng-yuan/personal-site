import { notFound } from 'next/navigation';
import { PostForm } from '@/components/admin/PostForm';
import { prisma } from '@/lib/prisma';
import { parseList } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const post = await prisma.post.findUnique({ where: { id: numericId } });
  if (!post) notFound();

  return (
    <PostForm
      initial={{
        id: post.id,
        slug: post.slug,
        titleZh: post.titleZh,
        titleEn: post.titleEn,
        excerptZh: post.excerptZh,
        excerptEn: post.excerptEn,
        contentZh: post.contentZh,
        contentEn: post.contentEn,
        cover: post.cover ?? '',
        tags: parseList(post.tags),
        published: post.published,
        featured: post.featured,
      }}
    />
  );
}
