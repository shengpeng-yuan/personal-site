import Link from 'next/link';
import {
  ArrowRight,
  Eye,
  FileText,
  FolderGit2,
  Mail,
  PenSquare,
  Plus,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatRelative } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [totalPosts, publishedPosts, totalProjects, unreadMessages, views, recentPosts, recentMessages] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { published: true } }),
      prisma.project.count(),
      prisma.message.count({ where: { read: false } }),
      prisma.post.aggregate({ _sum: { views: true } }),
      prisma.post.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, titleZh: true, titleEn: true, published: true, updatedAt: true, views: true },
      }),
      prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 4 }),
    ]);

  const stats = [
    { label: '文章总数', value: totalPosts, hint: `已发布 ${publishedPosts} · 草稿 ${totalPosts - publishedPosts}`, icon: FileText },
    { label: '项目总数', value: totalProjects, hint: '作品集条目', icon: FolderGit2 },
    { label: '累计阅读', value: views._sum.views ?? 0, hint: '所有文章浏览量之和', icon: Eye },
    { label: '未读留言', value: unreadMessages, hint: '访客提交的留言', icon: Mail },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">概览</h1>
          <p className="mt-1.5 text-sm text-muted">在这里管理你的个人站点内容</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/posts/new" className="btn btn-primary btn-sm">
            <PenSquare className="h-3.5 w-3.5" />
            写文章
          </Link>
          <Link href="/admin/projects/new" className="btn btn-ghost btn-sm">
            <Plus className="h-3.5 w-3.5" />
            新建项目
          </Link>
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{label}</span>
              <Icon className="h-4 w-4 text-brand-500" />
            </div>
            <div className="mt-3 text-3xl font-bold tabular-nums">{value}</div>
            <div className="mt-1 text-xs text-muted">{hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">最近编辑的文章</h2>
            <Link href="/admin/posts" className="inline-flex items-center gap-1 text-xs text-muted hover:text-brand-600">
              全部
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <ul className="mt-4 divide-y divide-[rgb(var(--border))]">
            {recentPosts.length === 0 && <li className="py-6 text-center text-sm text-muted">还没有文章</li>}
            {recentPosts.map((post) => (
              <li key={post.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="block truncate text-sm font-medium transition hover:text-brand-600"
                  >
                    {post.titleZh || post.titleEn}
                  </Link>
                  <div className="mt-0.5 text-xs text-muted">{formatRelative(post.updatedAt, 'zh')}</div>
                </div>
                <span className={post.published ? 'badge badge-brand' : 'badge'}>
                  {post.published ? '已发布' : '草稿'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">最新留言</h2>
            <Link href="/admin/messages" className="inline-flex items-center gap-1 text-xs text-muted hover:text-brand-600">
              全部
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <ul className="mt-4 divide-y divide-[rgb(var(--border))]">
            {recentMessages.length === 0 && <li className="py-6 text-center text-sm text-muted">还没有留言</li>}
            {recentMessages.map((message) => (
              <li key={message.id} className="py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{message.name}</span>
                  {!message.read && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                  <span className="ml-auto text-xs text-muted">{formatRelative(message.createdAt, 'zh')}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{message.content}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
