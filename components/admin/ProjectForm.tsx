'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { ImageInput } from '@/components/admin/ImageInput';
import { TagInput } from '@/components/admin/TagInput';
import { cn } from '@/lib/utils';

export type ProjectFormValues = {
  id?: number;
  slug: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  contentZh: string;
  contentEn: string;
  cover: string;
  tech: string[];
  repoUrl: string;
  demoUrl: string;
  status: string;
  featured: boolean;
  order: number;
};

const emptyValues: ProjectFormValues = {
  slug: '',
  nameZh: '',
  nameEn: '',
  descZh: '',
  descEn: '',
  contentZh: '',
  contentEn: '',
  cover: '',
  tech: [],
  repoUrl: '',
  demoUrl: '',
  status: 'active',
  featured: false,
  order: 0,
};

const statusOptions = [
  { value: 'active', label: '维护中' },
  { value: 'wip', label: '开发中' },
  { value: 'archived', label: '已归档' },
];

export function ProjectForm({ initial }: { initial?: ProjectFormValues }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const [form, setForm] = useState<ProjectFormValues>(initial ?? emptyValues);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [preview, setPreview] = useState(false);

  function update<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(editing ? `/api/projects/${initial?.id}` : '/api/projects', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? '保存失败');

      router.push('/admin/projects');
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败');
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing || !window.confirm('确定要删除这个项目吗？该操作不可恢复。')) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/projects/${initial?.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('删除失败');
      router.push('/admin/projects');
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败');
      setDeleting(false);
    }
  }

  const content = lang === 'zh' ? form.contentZh : form.contentEn;

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects"
            className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] text-muted transition hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{editing ? '编辑项目' : '新建项目'}</h1>
            <p className="text-xs text-muted">展示你的作品、技术栈与外链</p>
          </div>
        </div>

        {editing && (
          <button type="button" onClick={remove} disabled={deleting} className="btn btn-ghost btn-sm text-rose-500">
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            删除
          </button>
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">中文名称</label>
                <input
                  value={form.nameZh}
                  onChange={(event) => update('nameZh', event.target.value)}
                  placeholder="例如：数据可视化看板"
                  className="input"
                />
              </div>
              <div>
                <label className="label">英文名称</label>
                <input
                  value={form.nameEn}
                  onChange={(event) => update('nameEn', event.target.value)}
                  placeholder="e.g. Data Dashboard"
                  className="input"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="label">访问路径（slug）</label>
              <input
                value={form.slug}
                onChange={(event) => update('slug', event.target.value)}
                placeholder="留空则根据名称自动生成"
                className="input font-mono text-xs"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">中文简介</label>
                <textarea
                  value={form.descZh}
                  onChange={(event) => update('descZh', event.target.value)}
                  rows={3}
                  className="input resize-y"
                  placeholder="一句话说明这个项目做了什么"
                />
              </div>
              <div>
                <label className="label">英文简介</label>
                <textarea
                  value={form.descEn}
                  onChange={(event) => update('descEn', event.target.value)}
                  rows={3}
                  className="input resize-y"
                  placeholder="One line describing the project"
                />
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-2.5">
              <div className="flex gap-1">
                {(['zh', 'en'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLang(item)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                      lang === item
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                        : 'text-muted hover:bg-black/5 dark:hover:bg-white/10',
                    )}
                  >
                    {item === 'zh' ? '中文详情' : 'English'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setPreview((value) => !value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  preview
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                    : 'text-muted hover:bg-black/5 dark:hover:bg-white/10',
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                {preview ? '返回编辑' : '预览'}
              </button>
            </div>

            {preview ? (
              <div className="min-h-[320px] p-5">
                {content.trim() ? <Markdown content={content} /> : <p className="text-sm text-muted">暂无内容</p>}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(event) => update(lang === 'zh' ? 'contentZh' : 'contentEn', event.target.value)}
                rows={16}
                placeholder={'### 项目亮点\n\n- 支持 xxx\n- 使用 xxx 技术'}
                className="w-full resize-y border-0 bg-transparent p-5 font-mono text-[13px] leading-6 outline-none"
              />
            )}
          </div>

          <div className="card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">源码地址</label>
                <input
                  value={form.repoUrl}
                  onChange={(event) => update('repoUrl', event.target.value)}
                  placeholder="https://github.com/…"
                  className="input"
                />
              </div>
              <div>
                <label className="label">在线演示</label>
                <input
                  value={form.demoUrl}
                  onChange={(event) => update('demoUrl', event.target.value)}
                  placeholder="https://…"
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="card space-y-4 p-5">
            <div className="text-sm font-semibold">展示设置</div>

            <div>
              <label className="label">项目状态</label>
              <select
                value={form.status}
                onChange={(event) => update('status', event.target.value)}
                className="input"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>设为精选</span>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => update('featured', event.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
            </label>

            <div>
              <label className="label">排序权重</label>
              <input
                type="number"
                value={form.order}
                onChange={(event) => update('order', Number(event.target.value))}
                className="input"
              />
              <p className="mt-1.5 text-xs text-muted">数值越小越靠前</p>
            </div>
          </div>

          <div className="card p-5">
            <ImageInput value={form.cover} onChange={(value) => update('cover', value)} />
          </div>

          <div className="card p-5">
            <TagInput
              value={form.tech}
              onChange={(value) => update('tech', value)}
              label="技术栈"
              placeholder="例如 React，回车添加"
            />
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[rgb(var(--border))] glass">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/projects" className="btn btn-ghost btn-sm">
              取消
            </Link>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editing ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {editing ? '保存修改' : '创建项目'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
