import { prisma } from './prisma';

export type SiteSettings = {
  siteTitleZh: string;
  siteTitleEn: string;
  taglineZh: string;
  taglineEn: string;
  authorZh: string;
  authorEn: string;
  bioZh: string;
  bioEn: string;
  avatar: string;
  locationZh: string;
  locationEn: string;
  email: string;
  github: string;
  twitter: string;
  linkedin: string;
  wechat: string;
  resumeUrl: string;
  footerZh: string;
  footerEn: string;
  icp: string;
  skills: string[];
  available: boolean;
};

export const defaultSettings: SiteSettings = {
  siteTitleZh: '我的个人空间',
  siteTitleEn: 'My Personal Space',
  taglineZh: '写代码，也写生活',
  taglineEn: 'Code, thoughts and life',
  authorZh: '你的名字',
  authorEn: 'Your Name',
  bioZh:
    '你好，我是一名全栈开发者，专注于 Web 应用与工程效率。这里记录我的技术笔记、项目实践和一些生活随想。',
  bioEn:
    "Hi, I'm a full-stack developer focused on web applications and developer productivity. Here I share technical notes, project practices and random thoughts.",
  avatar: '',
  locationZh: '中国 · 上海',
  locationEn: 'Shanghai, China',
  email: 'hello@example.com',
  github: 'https://github.com/',
  twitter: '',
  linkedin: '',
  wechat: '',
  resumeUrl: '',
  footerZh: '用代码构建有趣的东西。',
  footerEn: 'Building interesting things with code.',
  icp: '',
  skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'AWS'],
  available: true,
};

const JSON_KEYS = new Set<keyof SiteSettings>(['skills']);
const BOOLEAN_KEYS = new Set<keyof SiteSettings>(['available']);

/** 读取站点设置，缺失的键回退到默认值 */
export async function getSettings(): Promise<SiteSettings> {
  const rows = await prisma.setting.findMany();
  const settings: SiteSettings = { ...defaultSettings };

  for (const row of rows) {
    const key = row.key as keyof SiteSettings;
    if (!(key in defaultSettings)) continue;

    if (JSON_KEYS.has(key)) {
      try {
        const parsed = JSON.parse(row.value);
        (settings[key] as unknown) = Array.isArray(parsed) ? parsed : defaultSettings[key];
      } catch {
        /* 忽略非法 JSON，保留默认值 */
      }
    } else if (BOOLEAN_KEYS.has(key)) {
      (settings[key] as unknown) = row.value === 'true';
    } else {
      (settings[key] as unknown) = row.value;
    }
  }

  return settings;
}

/** 批量写入站点设置（仅更新传入的字段） */
export async function saveSettings(patch: Partial<Record<keyof SiteSettings, unknown>>) {
  const entries = Object.entries(patch).filter(([key]) => key in defaultSettings);
  if (entries.length === 0) return;

  await prisma.$transaction(
    entries.map(([key, value]) => {
      const serialized =
        typeof value === 'boolean' ? String(value) : Array.isArray(value) ? JSON.stringify(value) : String(value ?? '');
      return prisma.setting.upsert({
        where: { key },
        create: { key, value: serialized },
        update: { value: serialized },
      });
    }),
  );
}

export function localizeSettings(settings: SiteSettings, locale: 'zh' | 'en') {
  return {
    siteTitle: locale === 'zh' ? settings.siteTitleZh : settings.siteTitleEn,
    tagline: locale === 'zh' ? settings.taglineZh : settings.taglineEn,
    author: locale === 'zh' ? settings.authorZh : settings.authorEn,
    bio: locale === 'zh' ? settings.bioZh : settings.bioEn,
    location: locale === 'zh' ? settings.locationZh : settings.locationEn,
    footer: locale === 'zh' ? settings.footerZh : settings.footerEn,
  };
}
