import Link from 'next/link';
import { Github, Globe, Linkedin, Mail, MessageCircle, Twitter } from 'lucide-react';
import type { Dictionary, Locale } from '@/lib/i18n';
import type { SiteSettings } from '@/lib/settings';
import { localizeSettings } from '@/lib/settings';

const socialLinks = [
  { key: 'github', icon: Github, label: 'GitHub' },
  { key: 'twitter', icon: Twitter, label: 'Twitter / X' },
  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
  { key: 'wechat', icon: MessageCircle, label: 'WeChat' },
] as const;

export function Footer({
  locale,
  dict,
  settings,
}: {
  locale: Locale;
  dict: Dictionary;
  settings: SiteSettings;
}) {
  const localized = localizeSettings(settings, locale);
  const year = new Date().getFullYear();
  const links = socialLinks.filter((item) => Boolean(settings[item.key]));

  return (
    <footer className="mt-24 border-t border-[rgb(var(--border))]">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="text-lg font-semibold">{localized.siteTitle}</div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{localized.footer}</p>
          {settings.available && (
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {locale === 'zh' ? '可接受合作邀请' : 'Open to opportunities'}
            </span>
          )}
        </div>

        <div>
          <div className="text-sm font-semibold">{dict.footer.quickLinks}</div>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {[
              { href: `/${locale}`, label: dict.nav.home },
              { href: `/${locale}/blog`, label: dict.nav.blog },
              { href: `/${locale}/projects`, label: dict.nav.projects },
              { href: `/${locale}/about`, label: dict.nav.about },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-brand-600 dark:hover:text-brand-300">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold">{dict.footer.followMe}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                title={settings.email}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] text-muted transition hover:text-brand-600"
              >
                <Mail className="h-4 w-4" />
              </a>
            )}
            {links.map(({ key, icon: Icon, label }) => (
              <a
                key={key}
                href={settings[key] as string}
                target="_blank"
                rel="noreferrer noopener"
                title={label}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] text-muted transition hover:text-brand-600"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
            {settings.resumeUrl && (
              <a
                href={settings.resumeUrl}
                target="_blank"
                rel="noreferrer noopener"
                title="Resume"
                className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] text-muted transition hover:text-brand-600"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[rgb(var(--border))]">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>
            © {year} {localized.author}. {dict.footer.rights}.
          </p>
          <p>
            {dict.footer.builtWith}
            {settings.icp ? ` · ${settings.icp}` : ''}
          </p>
        </div>
      </div>
    </footer>
  );
}
