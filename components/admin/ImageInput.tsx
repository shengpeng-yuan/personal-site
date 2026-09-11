'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';

/** 图片输入：支持本地上传或直接填写外链地址 */
export function ImageInput({
  value,
  onChange,
  label = '封面图',
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: data });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? '上传失败');
      onChange(body.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '上传失败');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <label className="label">{label}</label>

      <div className="flex gap-3">
        <div className="relative grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]">
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="cover" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-lg bg-black/60 text-white backdrop-blur"
                aria-label="移除图片"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <span className="text-xs text-muted">暂无图片</span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="图片地址，例如 /uploads/xxx.png 或 https://…"
            className="input"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn btn-ghost btn-sm"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {uploading ? '上传中' : '上传图片'}
            </button>
            <span className="text-xs text-muted">支持 png / jpg / webp，最大 5MB</span>
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
