'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Loader2, PenLine, Save, Trash2 } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { ImageInput } from '@/components/admin/ImageInput';
import { TagInput } from '@/components/admin/TagInput';
import { cn } from '@/lib/utils';

export type PostFormValues = {
  id?: number;
  slug: string;
  titleZh: string;
  titleEn: string;
  excerptZh: string;
  excerptEn: string;
  contentZh: string;
  contentEn: string;
  cover: string;
  tags: string[];
  published: boolean;
  featured: boolean;
};

const emptyValues: PostFormValues = {
  slug: '',
  titleZh: '',
  titleEn: '',
  excerptZh: '',
  excerptEn: '',
  contentZh: '',
  contentEn: '',
  cover: '',
  tags: [],
  published: true,
  featured: false,
};

export function PostForm({ initial }: { initial?: PostFormValues }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const [form, setForm] = useState<PostFormValues>(initial ?? emptyValues);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [preview, setPreview] = useState(false);

  function update<K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(editing ? `/api/posts/${initial?.id}` : '/api/posts', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? '保存失败');

      router.push('/admin/posts');
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败');
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing || !window.confirm('确定要删除这篇文章吗？该操作不可恢复。')) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/posts/${initial?.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('删除失败');
      router.push('/admin/posts');
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
          <Link href="/admin/posts" className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] text-muted transition hover:text-brand-600">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{editing ? '编辑文章' : '新建文章'}</h1>
            <p className="text-xs text-muted">支持 Markdown 语法，中英文内容可分别填写</p>
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
        {/* 主内容区 */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">中文标题</label>
                <input
                  value={form.titleZh}
                  onChange={(event) => update('titleZh', event.target.value)}
                  placeholder="例如：用 Next.js 搭建个人站点"
                  className="input"
                />
              </div>
              <div>
                <label className="label">英文标题</label>
                <input
                  value={form.titleEn}
                  onChange={(event) => update('titleEn', event.target.value)}
                  placeholder="e.g. Building a site with Next.js"
                  className="input"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="label">访问路径（slug）</label>
              <input
                value={form.slug}
                onChange={(event) => update('slug', event.target.value)}
                placeholder="留空则根据标题自动生成，例如 my-first-post"
                className="input font-mono text-xs"
              />
              <p className="mt-1.5 text-xs text-muted">
                文章地址：/{'{locale}'}/blog/{form.slug || '…'}
              </p>
            </div>
          </div>

          {/* 内容编辑 */}
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
                    {item === 'zh' ? '中文内容' : 'English'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setPreview((value) => !value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  preview ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'text-muted hover:bg-black/5 dark:hover:bg-white/10',
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                {preview ? '返回编辑' : '预览'}
              </button>
            </div>

            {preview ? (
              <div className="min-h-[380px] p-5">
                {content.trim() ? (
                  <Markdown content={content} />
                ) : (
                  <p className="text-sm text-muted">暂无内容</p>
                )}
              </div>
            ) : (
              <>
                <textarea
                  value={content}
                  onChange={(event) => update(lang === 'zh' ? 'contentZh' : 'contentEn', event.target.value)}
                  rows={20}
                  placeholder={'## 小标题\n\n在这里用 Markdown 撰写正文…\n\n```ts\nconst hello = "world";\n```'}
                  className="w-full resize-y border-0 bg-transparent p-5 font-mono text-[13px] leading-6 outline-none"
                />
                <div className="border-t border-[rgb(var(--border))] px-5 py-2 text-right text-xs text-muted">
                  {content.length} 字符
                </div>
              </>
            )}
          </div>

          {/* 摘要 */}
          <div className="card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">中文摘要</label>
                <textarea
                  value={form.excerptZh}
                  onChange={(event) => update('excerptZh', event.target.value)}
                  rows={3}
                  placeholder="列表页展示的简介，留空则显示正文开头"
                  className="input resize-y"
                />
              </div>
              <div>
                <label className="label">英文摘要</label>
                <textarea
                  value={form.excerptEn}
                  onChange={(event) => update('excerptEn', event.target.value)}
                  rows={3}
                  placeholder="Short summary shown in list pages"
                  className="input resize-y"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="card space-y-4 p-5">
            <div className="text-sm font-semibold">发布设置</div>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>立即发布</span>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) => update('published', event.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>设为精选</span>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => update('featured', event.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
            </label>

            <p className="text-xs text-muted">草稿不会出现在前台列表中。</p>
          </div>

          <div className="card p-5">
            <ImageInput value={form.cover} onChange={(value) => update('cover', value)} />
          </div>

          <div className="card p-5">
            <TagInput value={form.tags} onChange={(value) => update('tags', value)} label="标签" />
          </div>
        </aside>
      </div>

      {/* 底部操作条 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[rgb(var(--border))] glass">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/posts" className="btn btn-ghost btn-sm">
              取消
            </Link>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editing ? <Save className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
              {editing ? '保存修改' : '创建文章'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
