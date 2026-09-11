'use client';

import { useState } from 'react';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';

export function PasswordForm() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: String(data.get('currentPassword') ?? ''),
          newPassword: String(data.get('newPassword') ?? ''),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? '修改失败');

      form.reset();
      setMessage('密码已更新，下次登录请使用新密码');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '修改失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card p-5">
      <h2 className="font-semibold">修改登录密码</h2>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">当前密码</label>
          <input name="currentPassword" type="password" className="input" autoComplete="current-password" required />
        </div>
        <div>
          <label className="label">新密码（至少 8 位）</label>
          <input name="newPassword" type="password" className="input" autoComplete="new-password" minLength={8} required />
        </div>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            更新密码
          </button>
          {message && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </span>
          )}
          {error && <span className="text-sm text-rose-500">{error}</span>}
        </div>
      </form>
    </section>
  );
}
