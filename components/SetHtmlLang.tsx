'use client';

import { useEffect } from 'react';
import type { Locale } from '@/lib/i18n';

/** 根据当前语言同步 <html lang>，便于无障碍与搜索引擎识别 */
export function SetHtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }, [locale]);

  return null;
}
