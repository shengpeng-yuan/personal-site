import type { Metadata, Viewport } from 'next';
import { getSettings } from '@/lib/settings';
import { buildThemeScript } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '个人空间 | Personal Space',
    template: '%s | 个人空间',
  },
  description: '个人博客、项目作品与联系方式',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafc' },
    { media: '(prefers-color-scheme: dark)', color: '#080d17' },
  ],
};

// 首屏主题要根据站点设置（亮/暗时段）决定，而设置存在数据库里，
// 因此所有路由都按请求实时渲染，避免在构建期访问数据库。
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  // 这段脚本内联在 <head> 中同步执行，必须早于首次绘制，
  // 否则会出现「先白后黑」的闪动。
  const themeScript = buildThemeScript({
    enabled: settings.themeScheduleEnabled,
    lightStart: settings.themeLightStart,
    lightEnd: settings.themeLightEnd,
  });

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
