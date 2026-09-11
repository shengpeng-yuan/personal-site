'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, LogIn, User } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: String(data.get('username') ?? ''),
          password: String(data.get('password') ?? ''),
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? '登录失败');

      const from = new URLSearchParams(window.location.search).get('from');
      router.replace(from && from.startsWith('/admin') ? from : '/admin');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败');
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div className="aurora-bg">
        <div className="aurora-blob -left-20 top-0 h-72 w-72 animate-aurora bg-brand-500" />
        <div className="aurora-blob -right-10 bottom-0 h-80 w-80 animate-aurora bg-violet-500 [animation-delay:-8s]" />
      </div>

      <div className="card relative w-full max-w-sm p-8">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-glow">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-bold">后台管理</h1>
          <p className="mt-1.5 text-sm text-muted">请登录后管理站点内容</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="username">
              用户名
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="username"
                name="username"
                className="input pl-10"
                autoComplete="username"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">
              密码
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="password"
                name="password"
                type="password"
                className="input pl-10"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            登录
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/zh" className="transition hover:text-brand-600">
            返回网站首页
          </Link>
        </p>
      </div>
    </div>
  );
}
