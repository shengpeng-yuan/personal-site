'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, PenSquare, Search, Star, Trash2 } from 'lucide-react';

export type ProjectRow = {
  id: number;
  slug: string;
  nameZh: string;
  nameEn: string;
  tech: string[];
  status: string;
  featured: boolean;
  order: number;
};

const statusLabels: Record<string, string> = {
  active: '维护中',
  wip: '开发中',
  archived: '已归档',
};

export function ProjectsTable({ items }: { items: ProjectRow[] }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const visible = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return items.filter((item) =>
      query ? `${item.nameZh} ${item.nameEn} ${item.slug}`.toLowerCase().includes(query) : true,
    );
  }, [items, keyword]);

  async function remove(id: number) {
    if (!window.confirm('确定要删除这个项目吗？该操作不可恢复。')) return;
    setDeletingId(id);
    setError('');

    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('删除失败');
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] p-4">
        <span className="text-xs text-muted">共 {items.length} 个项目</span>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索项目名称或 slug"
            className="input py-2 pl-9 text-xs"
          />
        </div>
      </div>

      {error && <p className="px-4 pt-3 text-sm text-rose-500">{error}</p>}

      <div className="divide-y divide-[rgb(var(--border))]">
        {visible.length === 0 && <p className="py-14 text-center text-sm text-muted">没有符合条件的项目</p>}

        {visible.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-3 p-4 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/projects/${item.id}`}
                  className="truncate text-sm font-medium transition hover:text-brand-600"
                >
                  {item.nameZh || item.nameEn}
                </Link>
                {item.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="font-mono">/{item.slug}</span>
                <span>排序 {item.order}</span>
              </div>
              {item.tech.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {item.tech.map((tech) => (
                    <span key={tech} className="badge badge-brand">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <span className="badge">{statusLabels[item.status] ?? item.status}</span>

            <div className="flex items-center gap-1.5">
              <Link
                href={`/admin/projects/${item.id}`}
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
