'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import { ImageInput } from '@/components/admin/ImageInput';
import { TagInput } from '@/components/admin/TagInput';
import type { SiteSettings } from '@/lib/settings';

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? '保存失败');

      if (body.settings) setForm(body.settings as SiteSettings);
      setMessage('设置已保存');
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  const textFields: { key: keyof SiteSettings; label: string; placeholder?: string }[] = [
    { key: 'siteTitleZh', label: '站点名称（中文）' },
    { key: 'siteTitleEn', label: '站点名称（英文）' },
    { key: 'taglineZh', label: '一句话简介（中文）' },
    { key: 'taglineEn', label: '一句话简介（英文）' },
    { key: 'authorZh', label: '作者名（中文）' },
    { key: 'authorEn', label: '作者名（英文）' },
    { key: 'locationZh', label: '所在地（中文）' },
    { key: 'locationEn', label: '所在地（英文）' },
  ];

  const contactFields: { key: keyof SiteSettings; label: string; placeholder: string }[] = [
    { key: 'email', label: '邮箱', placeholder: 'hello@example.com' },
    { key: 'github', label: 'GitHub', placeholder: 'https://github.com/yourname' },
    { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/yourname' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname' },
    { key: 'wechat', label: '微信号', placeholder: 'your-wechat-id' },
    { key: 'resumeUrl', label: '简历链接', placeholder: 'https://…' },
  ];

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">站点设置</h1>
        <p className="mt-1.5 text-sm text-muted">这些信息会展示在前台页面与页脚</p>
      </header>

      <div className="mt-6 space-y-6">
        {/* 基础信息 */}
        <section className="card p-5">
          <h2 className="font-semibold">基础信息</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {textFields.map((field) => (
              <div key={field.key}>
                <label className="label">{field.label}</label>
                <input
                  value={String(form[field.key] ?? '')}
                  onChange={(event) => update(field.key, event.target.value as never)}
                  className="input"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">页脚文案（中文）</label>
              <textarea
                value={form.footerZh}
                onChange={(event) => update('footerZh', event.target.value)}
                rows={2}
                className="input resize-y"
              />
            </div>
            <div>
              <label className="label">页脚文案（英文）</label>
              <textarea
                value={form.footerEn}
                onChange={(event) => update('footerEn', event.target.value)}
                rows={2}
                className="input resize-y"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">ICP 备案号</label>
              <input
                value={form.icp}
                onChange={(event) => update('icp', event.target.value)}
                placeholder="例如：京ICP备00000000号"
                className="input"
              />
            </div>
            <label className="flex items-end gap-3 pb-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(event) => update('available', event.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              显示「可接受合作邀请」状态
            </label>
          </div>
        </section>

        {/* 个人介绍 */}
        <section className="card space-y-4 p-5">
          <h2 className="font-semibold">个人介绍</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">中文介绍（支持 Markdown）</label>
              <textarea
                value={form.bioZh}
                onChange={(event) => update('bioZh', event.target.value)}
                rows={8}
                className="input resize-y"
              />
            </div>
            <div>
              <label className="label">英文介绍（支持 Markdown）</label>
              <textarea
                value={form.bioEn}
                onChange={(event) => update('bioEn', event.target.value)}
                rows={8}
                className="input resize-y"
              />
            </div>
          </div>

          <ImageInput value={form.avatar} onChange={(value) => update('avatar', value)} label="头像" />
        </section>

        {/* 技能 */}
        <section className="card p-5">
          <TagInput
            value={form.skills}
            onChange={(value) => update('skills', value)}
            label="技能 / 技术栈"
            placeholder="例如 TypeScript，回车添加"
          />
        </section>

        {/* 联系方式 */}
        <section className="card p-5">
          <h2 className="font-semibold">联系方式</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {contactFields.map((field) => (
              <div key={field.key}>
                <label className="label">{field.label}</label>
                <input
                  value={String(form[field.key] ?? '')}
                  onChange={(event) => update(field.key, event.target.value as never)}
                  placeholder={field.placeholder}
                  className="input"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[rgb(var(--border))] glass">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          {error && <p className="text-sm text-rose-500">{error}</p>}
          {message && !error && (
            <p className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </p>
          )}
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm ml-auto">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
