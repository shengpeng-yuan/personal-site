'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

/** 标签输入：回车或逗号添加，点击 × 移除 */
export function TagInput({
  value,
  onChange,
  label,
  placeholder = '输入后按回车添加',
}: {
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const items = draft
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (items.length === 0) return;

    const next = [...value];
    for (const item of items) {
      if (!next.includes(item)) next.push(item);
    }
    onChange(next);
    setDraft('');
  }

  return (
    <div>
      <label className="label">{label}</label>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit();
            }
            if (event.key === 'Backspace' && !draft && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={placeholder}
          className="input"
        />
        <button type="button" onClick={commit} className="btn btn-ghost btn-sm shrink-0" aria-label="添加">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {value.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {value.map((item) => (
            <span key={item} className="badge badge-brand">
              {item}
              <button type="button" onClick={() => onChange(value.filter((tag) => tag !== item))} aria-label="移除">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
