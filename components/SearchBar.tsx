'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState } from 'react';
import type { Dictionary, Locale } from '@/lib/i18n';

export function SearchBar({
  locale,
  dict,
  defaultValue = '',
  placeholder,
}: {
  locale: Locale;
  dict: Dictionary;
  defaultValue?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const query = value.trim();
    router.push(query ? `/${locale}/blog?q=${encodeURIComponent(query)}` : `/${locale}/blog`);
  }

  return (
    <form onSubmit={submit} className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder ?? dict.common.searchPlaceholder}
        className="input pl-10 pr-20"
        aria-label={dict.common.search}
      />
      <button type="submit" className="btn btn-primary btn-sm absolute right-1.5 top-1/2 -translate-y-1/2">
        {dict.common.search}
      </button>
    </form>
  );
}
