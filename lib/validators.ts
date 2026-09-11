import { slugify } from './utils';

export type PostPayload = {
  slug?: string;
  titleZh?: string;
  titleEn?: string;
  excerptZh?: string;
  excerptEn?: string;
  contentZh?: string;
  contentEn?: string;
  cover?: string | null;
  tags?: string[];
  published?: boolean;
  featured?: boolean;
};

export type ProjectPayload = {
  slug?: string;
  nameZh?: string;
  nameEn?: string;
  descZh?: string;
  descEn?: string;
  contentZh?: string;
  contentEn?: string;
  cover?: string | null;
  tech?: string[];
  repoUrl?: string | null;
  demoUrl?: string | null;
  status?: string;
  featured?: boolean;
  order?: number;
};

const PROJECT_STATUS = ['active', 'wip', 'archived'];

function normalizeUrl(value: unknown): string | null {
  const url = String(value ?? '').trim();
  return url || null;
}

/** 把请求体转换为文章可写入的数据，同时做必要校验 */
export function buildPostData(body: PostPayload, existing?: { publishedAt: Date | null }) {
  const titleZh = String(body.titleZh ?? '').trim();
  const titleEn = String(body.titleEn ?? '').trim();

  if (!titleZh && !titleEn) {
    throw new Error('请至少填写一种语言的标题');
  }

  const slug = String(body.slug ?? '').trim() || slugify(titleZh || titleEn);
  if (!slug) {
    throw new Error('无法生成合法的访问路径（slug），请手动填写');
  }

  const published = Boolean(body.published);

  return {
    slug,
    titleZh: titleZh || titleEn,
    titleEn,
    excerptZh: String(body.excerptZh ?? '').trim(),
    excerptEn: String(body.excerptEn ?? '').trim(),
    contentZh: String(body.contentZh ?? ''),
    contentEn: String(body.contentEn ?? ''),
    cover: normalizeUrl(body.cover),
    tags: JSON.stringify(
      Array.isArray(body.tags) ? body.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    ),
    published,
    featured: Boolean(body.featured),
    publishedAt: published ? existing?.publishedAt ?? new Date() : existing?.publishedAt ?? null,
  };
}

/** 把请求体转换为项目可写入的数据 */
export function buildProjectData(body: ProjectPayload) {
  const nameZh = String(body.nameZh ?? '').trim();
  const nameEn = String(body.nameEn ?? '').trim();

  if (!nameZh && !nameEn) {
    throw new Error('请至少填写一种语言的项目名称');
  }

  const slug = String(body.slug ?? '').trim() || slugify(nameZh || nameEn);
  if (!slug) {
    throw new Error('无法生成合法的访问路径（slug），请手动填写');
  }

  const status = PROJECT_STATUS.includes(String(body.status)) ? String(body.status) : 'active';

  return {
    slug,
    nameZh: nameZh || nameEn,
    nameEn,
    descZh: String(body.descZh ?? '').trim(),
    descEn: String(body.descEn ?? '').trim(),
    contentZh: String(body.contentZh ?? ''),
    contentEn: String(body.contentEn ?? ''),
    cover: normalizeUrl(body.cover),
    tech: JSON.stringify(
      Array.isArray(body.tech) ? body.tech.map((item) => String(item).trim()).filter(Boolean) : [],
    ),
    repoUrl: normalizeUrl(body.repoUrl),
    demoUrl: normalizeUrl(body.demoUrl),
    status,
    featured: Boolean(body.featured),
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
  };
}

/** 统一的 Prisma 唯一约束错误判断 */
export function isUniqueConstraintError(error: unknown) {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}
