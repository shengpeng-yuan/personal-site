'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Loader2, PenSquare, Search, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PostRow = {
  id: number;
  slug: string;
  titleZh: string;
  titleEn: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  views: number;
  updatedAt: string;
};

export function PostsTable({ items }: { items: PostRow[] }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const visible = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return items
      .filter((item) => (status === 'all' ? true : status === 'published' ? item.published : !item.published))
      .filter((item) =>
        query ? `${item.titleZh} ${item.titleEn} ${item.slug}`.toLowerCase().includes(query) : true,
      );
  }, [items, keyword, status]);

  async function remove(id: number) {
    if (!window.confirm('确定要删除这篇文章吗？该操作不可恢复。')) return;
    setDeletingId(id);
    setError('');

    try {
      const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('删除失败');
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  const filters: { key: typeof status; label: string }[] = [
    { key: 'all', label: `全部 ${items.length}` },
    { key: 'published', label: `已发布 ${items.filter((item) => item.published).length}` },
    { key: 'draft', label: `草稿 ${items.filter((item) => !item.published).length}` },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-[rgb(var(--border))] p-4">
        <div className="flex gap-1">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatus(item.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                status === item.key
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                  : 'text-muted hover:bg-black/5 dark:hover:bg-white/10',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索标题或 slug"
            className="input py-2 pl-9 text-xs"
          />
        </div>
      </div>

      {error && <p className="px-4 pt-3 text-sm text-rose-500">{error}</p>}

      <div className="divide-y divide-[rgb(var(--border))]">
        {visible.length === 0 && (
          <p className="py-14 text-center text-sm text-muted">没有符合条件的文章</p>
        )}

        {visible.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-3 p-4 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/posts/${item.id}`}
                  className="truncate text-sm font-medium transition hover:text-brand-600"
                >
                  {item.titleZh || item.titleEn}
                </Link>
                {item.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="font-mono">/{item.slug}</span>
                <span>更新于 {item.updatedAt}</span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {item.views}
                </span>
              </div>
              {item.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="badge">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <span className={item.published ? 'badge badge-brand' : 'badge'}>
              {item.published ? '已发布' : '草稿'}
            </span>

            <div className="flex items-center gap-1.5">
              <Link
                href={`/admin/posts/${item.id}`}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[rgb(var(--border))] text-muted transition hover:text-brand-600"
                title="编辑"
              >
                <PenSquare className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => remove(item.id)}
                disabled={deletingId === item.id}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[rgb(var(--border))] text-muted transition hover:text-rose-500"
                title="删除"
              >
                {deletingId === item.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
