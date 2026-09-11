'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FolderGit2,
  Gauge,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: '概览', icon: LayoutDashboard },
  { href: '/admin/posts', label: '文章', icon: Gauge },
  { href: '/admin/projects', label: '项目', icon: FolderGit2 },
  { href: '/admin/messages', label: '留言', icon: Mail },
  { href: '/admin/settings', label: '站点设置', icon: Settings },
];

export function AdminShell({
  children,
  username,
  unreadCount,
}: {
  children: React.ReactNode;
  username: string;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  const navigation = (
    <nav className="space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
              active
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                : 'text-muted hover:bg-black/5 hover:text-[rgb(var(--fg))] dark:hover:bg-white/10',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {href === '/admin/messages' && unreadCount > 0 && (
              <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      {/* 移动端顶栏 */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[rgb(var(--border))] glass px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-brand-500" />
          后台管理
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="menu"
          className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))]"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex">
        {/* 侧边栏 */}
        <aside
          className={cn(
            'fixed inset-x-0 top-14 z-30 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-5',
            open ? 'block' : 'hidden lg:block',
          )}
        >
          <Link href="/admin" className="mb-6 hidden items-center gap-2.5 lg:flex">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-glow">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">后台管理</span>
          </Link>

          {navigation}

          <div className="mt-6 border-t border-[rgb(var(--border))] pt-4">
            <div className="px-3.5 text-xs text-muted">
              登录账号：<span className="font-medium">{username}</span>
            </div>
            <Link
              href="/zh"
              className="mt-3 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-muted transition hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4" />
              查看网站
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-rose-500 transition hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
