'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Mail, Trash2, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageRow = {
  id: number;
  name: string;
  email: string;
  content: string;
  read: boolean;
  createdAt: string;
};

export function MessagesPanel({ items }: { items: MessageRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const visible = useMemo(
    () => (filter === 'unread' ? items.filter((item) => !item.read) : items),
    [items, filter],
  );

  async function mutate(id: number, action: 'toggle' | 'delete', read?: boolean) {
    setBusyId(id);
    setError('');

    try {
      const response =
        action === 'delete'
          ? await fetch(`/api/messages/${id}`, { method: 'DELETE' })
          : await fetch(`/api/messages/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ read }),
            });

      if (!response.ok) throw new Error(action === 'delete' ? '删除失败' : '更新失败');
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '操作失败');
    } finally {
      setBusyId(null);
    }
  }

  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {([
            { key: 'all', label: `全部 ${items.length}` },
            { key: 'unread', label: `未读 ${unreadCount}` },
          ] as const).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                filter === item.key
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                  : 'text-muted hover:bg-black/5 dark:hover:bg-white/10',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </div>

      <div className="mt-4 space-y-4">
        {visible.length === 0 && (
          <div className="card py-16 text-center text-sm text-muted">暂无留言</div>
        )}

        {visible.map((item) => (
          <article
            key={item.id}
            className={cn('card p-5', !item.read && 'border-brand-400/60 shadow-soft')}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-600 dark:text-brand-300">
                {item.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  {!item.read && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                </div>
                <a href={`mailto:${item.email}`} className="text-xs text-muted hover:text-brand-600">
                  {item.email}
                </a>
              </div>
              <span className="ml-auto text-xs text-muted">{item.createdAt}</span>
            </div>

            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{item.content}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[rgb(var(--border))] pt-3">
              <a href={`mailto:${item.email}?subject=Re: 你的留言`} className="btn btn-ghost btn-sm">
                <Mail className="h-3.5 w-3.5" />
                回复
              </a>

              <button
                type="button"
                onClick={() => mutate(item.id, 'toggle', !item.read)}
                disabled={busyId === item.id}
                className="btn btn-ghost btn-sm"
              >
                {busyId === item.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : item.read ? (
                  <Undo2 className="h-3.5 w-3.5" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                {item.read ? '标为未读' : '标为已读'}
              </button>

              <button
                type="button"
                onClick={() => mutate(item.id, 'delete')}
                disabled={busyId === item.id}
                className="btn btn-ghost btn-sm ml-auto text-rose-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
