import { prisma } from './prisma';
import { parseList } from './utils';

export type PostSummary = {
  id: number;
  slug: string;
  titleZh: string;
  titleEn: string;
  excerptZh: string;
  excerptEn: string;
  cover: string | null;
  tags: string[];
  featured: boolean;
  views: number;
  publishedAt: Date | null;
};

const postSummarySelect = {
  id: true,
  slug: true,
  titleZh: true,
  titleEn: true,
  excerptZh: true,
  excerptEn: true,
  cover: true,
  tags: true,
  featured: true,
  views: true,
  publishedAt: true,
} as const;

type RawPostSummary = {
  id: number;
  slug: string;
  titleZh: string;
  titleEn: string;
  excerptZh: string;
  excerptEn: string;
  cover: string | null;
  tags: string;
  featured: boolean;
  views: number;
  publishedAt: Date | null;
};

function toSummary(row: RawPostSummary): PostSummary {
  return { ...row, tags: parseList(row.tags) };
}

export type PostQuery = {
  tag?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  featuredOnly?: boolean;
};

/** 查询已发布文章（支持标签、关键词搜索与分页） */
export async function queryPosts({
  tag,
  q,
  page = 1,
  pageSize = 6,
  featuredOnly = false,
}: PostQuery = {}) {
  const rows = await prisma.post.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    select: postSummarySelect,
  });

  const keyword = q?.trim().toLowerCase();
  const filtered = rows
    .map(toSummary)
    .filter((post) => (tag ? post.tags.includes(tag) : true))
    .filter((post) => (featuredOnly ? post.featured : true))
    .filter((post) =>
      keyword
        ? [post.titleZh, post.titleEn, post.excerptZh, post.excerptEn]
            .join(' ')
            .toLowerCase()
            .includes(keyword)
        : true,
    );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page: safePage,
    totalPages,
    pageSize,
  };
}

export async function getFeaturedPosts(limit = 3) {
  const rows = await prisma.post.findMany({
    where: { published: true, featured: true },
    orderBy: [{ publishedAt: 'desc' }],
    take: limit,
    select: postSummarySelect,
  });
  return rows.map(toSummary);
}

export async function getPostBySlug(slug: string) {
  return prisma.post.findFirst({ where: { slug, published: true } });
}

/** 上一批 / 下一批文章 */
export async function getAdjacentPosts(publishedAt: Date | null, id: number) {
  const current = publishedAt ?? new Date(0);

  const [prev, next] = await Promise.all([
    prisma.post.findFirst({
      where: { published: true, publishedAt: { lt: current } },
      orderBy: { publishedAt: 'desc' },
      select: postSummarySelect,
    }),
    prisma.post.findFirst({
      where: { published: true, publishedAt: { gt: current } },
      orderBy: { publishedAt: 'asc' },
      select: postSummarySelect,
    }),
  ]);

  // 时间相同的极端情况下按 id 兜底
  const fallbackPrev =
    prev ??
    (await prisma.post.findFirst({
      where: { published: true, id: { lt: id }, publishedAt: current },
      orderBy: { id: 'desc' },
      select: postSummarySelect,
    }));

  return {
    prev: fallbackPrev ? toSummary(fallbackPrev) : null,
    next: next ? toSummary(next) : null,
  };
}

/** 相关文章：优先取标签重合度最高的 */
export async function getRelatedPosts(slug: string, tags: string[], limit = 3) {
  if (tags.length === 0) return [];
  const rows = await prisma.post.findMany({
    where: { published: true, slug: { not: slug } },
    orderBy: { publishedAt: 'desc' },
    take: 30,
    select: postSummarySelect,
  });

  return rows
    .map(toSummary)
    .map((post) => ({
      post,
      score: post.tags.filter((item) => tags.includes(item)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.post);
}

/** 所有已发布文章的标签及数量 */
export async function getPostTags() {
  const rows = await prisma.post.findMany({
    where: { published: true },
    select: { tags: true },
  });

  const counter = new Map<string, number>();
  for (const row of rows) {
    for (const tag of parseList(row.tags)) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1);
    }
  }
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export type ProjectItem = {
  id: number;
  slug: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  contentZh: string;
  contentEn: string;
  cover: string | null;
  tech: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  status: string;
  featured: boolean;
  order: number;
};

export async function getProjects() {
  const rows = await prisma.project.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  return rows.map((row) => ({ ...row, tech: parseList(row.tech) })) as ProjectItem[];
}

export async function getProjectBySlug(slug: string) {
  const row = await prisma.project.findUnique({ where: { slug } });
  return row ? ({ ...row, tech: parseList(row.tech) } as ProjectItem) : null;
}

export async function getSiteStats() {
  const [posts, projects, views] = await Promise.all([
    prisma.post.count({ where: { published: true } }),
    prisma.project.count(),
    prisma.post.aggregate({ _sum: { views: true } }),
  ]);
  return { posts, projects, views: views._sum.views ?? 0 };
}
