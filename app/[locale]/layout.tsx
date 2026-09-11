import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SecretAdminKeyboard } from '@/components/SecretAdminEntry';
import { SetHtmlLang } from '@/components/SetHtmlLang';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { getDictionary, isLocale, locales, type Locale } from '@/lib/i18n';
import { getSettings, localizeSettings } from '@/lib/settings';

// 内容来自数据库，统一按请求实时渲染（避免构建期依赖数据库文件）
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const current: Locale = isLocale(locale) ? locale : 'zh';
  const settings = await getSettings();
  const localized = localizeSettings(settings, current);

  return {
    title: { default: localized.siteTitle, template: `%s | ${localized.siteTitle}` },
    description: localized.tagline,
    openGraph: {
      title: localized.siteTitle,
      description: localized.tagline,
      type: 'website',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const settings = await getSettings();
  const localized = localizeSettings(settings, locale);
  const themeSchedule = {
    enabled: settings.themeScheduleEnabled,
    lightStart: settings.themeLightStart,
    lightEnd: settings.themeLightEnd,
  };

  return (
    <>
      <SetHtmlLang locale={locale} />
      {/* 前台隐藏入口：依次敲入密语可进入后台（详见 components/SecretAdminEntry.tsx） */}
      <SecretAdminKeyboard />
      <div className="flex min-h-screen flex-col">
        <Header
          locale={locale}
          dict={dict}
          siteTitle={localized.siteTitle}
          themeSchedule={themeSchedule}
        />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} dict={dict} settings={settings} />
      </div>
    </>
  );
}
