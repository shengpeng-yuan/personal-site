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
  /** ICP 备案号与工信部备案系统链接 */
  icp: string;
  icpUrl: string;
  /** 公安联网备案号与全国互联网安全管理服务平台链接 */
  police: string;
  policeUrl: string;
  skills: string[];
  available: boolean;
  /** 是否按访客本地时间自动切换主题 */
  themeScheduleEnabled: boolean;
  /** 亮色时段开始时间，格式 HH:MM */
  themeLightStart: string;
  /** 亮色时段结束时间，格式 HH:MM（其余时段为暗色，支持跨午夜） */
  themeLightEnd: string;
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
  icpUrl: 'https://beian.miit.gov.cn/',
  police: '',
  policeUrl: '',
  skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'AWS'],
  available: true,
  themeScheduleEnabled: true,
  themeLightStart: '07:00',
  themeLightEnd: '19:00',
};

const JSON_KEYS = new Set<keyof SiteSettings>(['skills']);
const BOOLEAN_KEYS = new Set<keyof SiteSettings>(['available', 'themeScheduleEnabled']);
const TIME_KEYS = new Set<keyof SiteSettings>(['themeLightStart', 'themeLightEnd']);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

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
    } else if (TIME_KEYS.has(key)) {
      // 时间格式非法时回退到默认值，避免前台脚本计算出奇怪的主题
      (settings[key] as unknown) = TIME_PATTERN.test(row.value)
        ? row.value
        : defaultSettings[key];
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
