'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ContactForm({ dict }: { dict: Dictionary }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      content: String(data.get('content') ?? '').trim(),
    };

    if (!payload.name || !payload.email || !payload.content) {
      setStatus('error');
      setError(dict.about.required);
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'failed');
      }
      form.reset();
      setStatus('success');
    } catch (submitError) {
      setStatus('error');
      setError(submitError instanceof Error && submitError.message !== 'failed' ? submitError.message : dict.about.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            {dict.about.name}
          </label>
          <input id="name" name="name" className="input" autoComplete="name" required />
        </div>
        <div>
          <label className="label" htmlFor="email">
            {dict.about.email}
          </label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="content">
          {dict.about.message}
        </label>
        <textarea id="content" name="content" rows={5} className="input resize-y" required />
      </div>

      {status === 'error' && <p className="text-sm text-rose-500">{error}</p>}
      {status === 'success' && (
        <p className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {dict.about.success}
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {dict.about.submitting}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {dict.about.submit}
          </>
        )}
      </button>
    </form>
  );
}
