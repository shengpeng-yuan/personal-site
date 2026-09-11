import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  const [posts, projects] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.project.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const staticPaths = ['', '/blog', '/projects', '/about'];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${base}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: path === '' ? 1 : 0.8,
      });
    }

    for (const post of posts) {
      entries.push({
        url: `${base}/${locale}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    for (const project of projects) {
      entries.push({
        url: `${base}/${locale}/projects/${project.slug}`,
        lastModified: project.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  return entries;
}
