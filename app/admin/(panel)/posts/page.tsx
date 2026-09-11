import Link from 'next/link';
import { PenSquare } from 'lucide-react';
import { PostsTable, type PostRow } from '@/components/admin/PostsTable';
import { prisma } from '@/lib/prisma';
import { formatDate, parseList } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      titleZh: true,
      titleEn: true,
      tags: true,
      published: true,
      featured: true,
      views: true,
      updatedAt: true,
    },
  });

  const items: PostRow[] = posts.map((post) => ({
    ...post,
    tags: parseList(post.tags),
    updatedAt: formatDate(post.updatedAt, 'zh'),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">文章管理</h1>
          <p className="mt-1.5 text-sm text-muted">共 {items.length} 篇文章</p>
        </div>
        <Link href="/admin/posts/new" className="btn btn-primary btn-sm">
          <PenSquare className="h-3.5 w-3.5" />
          写文章
        </Link>
      </header>

      <div className="mt-6">
        <PostsTable items={items} />
      </div>
    </div>
  );
}
