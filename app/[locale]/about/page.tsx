import { notFound } from 'next/navigation';
import { Github, Globe, Linkedin, Mail, MapPin, MessageCircle, Twitter } from 'lucide-react';
import { ContactForm } from '@/components/ContactForm';
import { Markdown } from '@/components/Markdown';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { getSettings, localizeSettings, type SiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

type ContactItem = { icon: typeof Mail; label: string; value: string; href: string };

function buildContacts(settings: SiteSettings): ContactItem[] {
  const items: ContactItem[] = [];
  if (settings.email) items.push({ icon: Mail, label: 'Email', value: settings.email, href: `mailto:${settings.email}` });
  if (settings.github)
    items.push({ icon: Github, label: 'GitHub', value: settings.github.replace(/^https?:\/\//, ''), href: settings.github });
  if (settings.twitter)
    items.push({
      icon: Twitter,
      label: 'Twitter / X',
      value: settings.twitter.replace(/^https?:\/\//, ''),
      href: settings.twitter,
    });
  if (settings.linkedin)
    items.push({
      icon: Linkedin,
      label: 'LinkedIn',
      value: settings.linkedin.replace(/^https?:\/\//, ''),
      href: settings.linkedin,
    });
  if (settings.wechat) items.push({ icon: MessageCircle, label: 'WeChat', value: settings.wechat, href: '#' });
  if (settings.resumeUrl) items.push({ icon: Globe, label: 'Resume', value: settings.resumeUrl, href: settings.resumeUrl });
  return items;
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const current: Locale = locale;
  const dict = getDictionary(current);
  const settings = await getSettings();
  const localized = localizeSettings(settings, current);
  const contacts = buildContacts(settings);
  const initial = localized.author.trim().charAt(0).toUpperCase() || 'A';

  return (
    <div className="container py-12 sm:py-16">
      {/* 个人名片 */}
      <section className="card relative overflow-hidden p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-violet-500 text-3xl font-bold text-white shadow-glow">
            {settings.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.avatar} alt={localized.author} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{localized.author}</h1>
            <p className="mt-2 text-muted">{localized.tagline}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
              {localized.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {localized.location}
                </span>
              )}
              {settings.available && (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {current === 'zh' ? '可接受合作邀请' : 'Open to opportunities'}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {/* 自我介绍 */}
          <section>
            <h2 className="section-title">{dict.about.title}</h2>
            <div className="mt-5">
              <Markdown content={localized.bio} />
            </div>
          </section>

          {/* 技能 */}
          {settings.skills.length > 0 && (
            <section className="mt-12">
              <h2 className="section-title">{dict.home.skills}</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {settings.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-xl border border-[rgb(var(--border))] px-3.5 py-2 text-sm font-medium transition hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 联系方式 */}
          {contacts.length > 0 && (
            <section className="mt-12">
              <h2 className="section-title">{dict.about.contactTitle}</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {contacts.map(({ icon: Icon, label, value, href }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer noopener"
                    className="card card-hover flex items-center gap-3 p-4"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-muted">{label}</span>
                      <span className="block truncate text-sm font-medium">{value}</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 留言表单 */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-lg font-semibold">{dict.about.sendMessage}</h2>
            <p className="mt-1.5 text-sm text-muted">
              {current === 'zh'
                ? '有任何想法或合作意向，欢迎留言，我会尽快回复。'
                : 'Have an idea or want to collaborate? Drop a message and I will get back to you.'}
            </p>
            <div className="mt-5">
              <ContactForm dict={dict} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
