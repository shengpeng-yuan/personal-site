import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { locales, type Locale } from './i18n';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** 解析数据库中存放的 JSON 字符串数组 */
export function parseList(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function formatDate(date: Date | string, locale: Locale): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  return format(value, locale === 'zh' ? 'yyyy年M月d日' : 'MMM d, yyyy', {
    locale: locale === 'zh' ? zhCN : enUS,
  });
}

export function formatRelative(date: Date | string, locale: Locale): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(value, {
    addSuffix: true,
    locale: locale === 'zh' ? zhCN : enUS,
  });
}

/** 估算阅读时长（中文按字符数，英文按单词数） */
export function readingTime(text: string, locale: Locale): number {
  if (!text) return 1;
  const minutes =
    locale === 'zh'
      ? Math.ceil(text.replace(/\s/g, '').length / 350)
      : Math.ceil(text.split(/\s+/).filter(Boolean).length / 200);
  return Math.max(1, minutes);
}

/** 由标题生成 URL 友好的 slug，中文会被保留并做安全替换 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

export function truncate(text: string, length = 120): string {
  const plain = text.replace(/[#*`>_\[\]()!-]/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

/** 在前台页面之间跳转时保留当前语言前缀 */
export function localePath(locale: Locale, path = ''): string {
  const clean = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `/${locale}${clean}`;
}
