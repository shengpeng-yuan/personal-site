import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const posts = [
  {
    slug: 'building-a-personal-site-with-nextjs',
    titleZh: '用 Next.js 打造一个属于你自己的个人站点',
    titleEn: 'Building a personal site with Next.js',
    excerptZh:
      '从技术选型到部署上线，完整记录一个个人站点的搭建过程，包含前台展示与后台管理的设计思路。',
    excerptEn:
      'From choosing the stack to going live, a full walkthrough of building a personal site with both a public frontend and an admin panel.',
    tags: ['Next.js', 'TypeScript', '工程实践'],
    featured: true,
    cover: '',
    contentZh: `## 为什么需要一个个人站点

在社交平台之外，个人站点是唯一完全属于你的空间：域名、内容、样式都由你决定。它既是简历的延伸，也是长期积累的容器。

## 技术选型

- **Next.js（App Router）**：同时提供页面渲染与后端 API，一个进程即可跑完整站
- **Tailwind CSS**：快速构建设计系统，深色模式开箱即用
- **Prisma + SQLite**：本地零配置，部署时单文件备份即可

\`\`\`ts
// 一个最简单的服务端数据读取
export const dynamic = 'force-dynamic';

const posts = await prisma.post.findMany({
  where: { published: true },
  orderBy: { publishedAt: 'desc' },
});
\`\`\`

## 目录结构建议

| 目录 | 职责 |
| --- | --- |
| \`app/(site)\` | 面向访客的页面 |
| \`app/admin\` | 后台管理页面 |
| \`app/api\` | 后端接口 |
| \`lib\` | 数据访问、鉴权、工具函数 |

## 上线

使用 PM2 守护进程 + nginx 反向代理，几分钟即可完成部署。详细步骤见项目中的部署文档。

> 重要的是先上线，再迭代。一个粗糙但真实的站点，远胜过永远停留在草稿的完美设计。
`,
    contentEn: `## Why own a personal site

Beyond social platforms, a personal site is the only space that fully belongs to you: domain, content and design are all yours. It extends your resume and accumulates your work over time.

## Choosing the stack

- **Next.js (App Router)**: pages and backend APIs in one process
- **Tailwind CSS**: build a design system quickly, dark mode included
- **Prisma + SQLite**: zero-config locally, a single file to back up in production

\`\`\`ts
// The simplest server-side data read
const posts = await prisma.post.findMany({
  where: { published: true },
  orderBy: { publishedAt: 'desc' },
});
\`\`\`

## Recommended structure

| Folder | Responsibility |
| --- | --- |
| \`app/(site)\` | Public pages |
| \`app/admin\` | Admin panel |
| \`app/api\` | Backend endpoints |
| \`lib\` | Data access, auth, utilities |

## Going live

PM2 plus an nginx reverse proxy gets you deployed in minutes.

> Ship first, iterate later. A rough but real site beats a perfect design that never leaves the draft folder.
`,
  },
  {
    slug: 'how-i-organize-my-dev-workflow',
    titleZh: '我是如何组织日常开发工作流的',
    titleEn: 'How I organize my daily development workflow',
    excerptZh: '一套用了三年仍在迭代的工作流：编辑器配置、分支策略、自动化脚本与专注方法。',
    excerptEn:
      'A workflow I have refined for three years: editor setup, branching strategy, automation scripts and staying focused.',
    tags: ['效率', '工具链'],
    featured: true,
    cover: '',
    contentZh: `## 编辑器

统一的快捷键与插件集能显著降低上下文切换成本。我的核心原则是 **让手离开键盘的次数越少越好**。

## 分支策略

\`\`\`bash
git switch -c feat/post-pagination
# 小步提交，提交信息写清楚"为什么"
git commit -m "feat(blog): 支持按标签筛选文章"
\`\`\`

## 自动化

把重复三次以上的操作写成脚本：

1. 一键创建数据库备份
2. 一键生成文章模板
3. 一键检查并格式化代码

## 专注

- 每天只设定 **一个** 主要目标
- 用番茄钟切分深度工作时间
- 结束时写下"明天从哪一行代码继续"
`,
    contentEn: `## Editor

A consistent set of shortcuts and extensions dramatically reduces context switching. My core principle: **keep your hands on the keyboard**.

## Branching

\`\`\`bash
git switch -c feat/post-pagination
# Commit in small steps, explain the "why"
git commit -m "feat(blog): filter posts by tag"
\`\`\`

## Automation

If you do it more than three times, script it:

1. One-command database backup
2. One-command post template
3. One-command lint and format

## Focus

- Set exactly **one** main goal per day
- Split deep work into pomodoros
- End the day by noting where to resume tomorrow
`,
  },
  {
    slug: 'notes-on-writing-sql-by-hand',
    titleZh: '手写 SQL 的一些思考',
    titleEn: 'Notes on writing SQL by hand',
    excerptZh: 'ORM 很舒服，但理解底层查询依然重要。几个真实场景下的 SQL 优化记录。',
    excerptEn:
      'ORMs are comfortable, but understanding the query underneath still matters. A few real optimization notes.',
    tags: ['SQL', '性能'],
    featured: false,
    cover: '',
    contentZh: `## 慢查询从哪里来

多数性能问题不是"SQL 太慢"，而是**索引缺失**或**查询了不需要的数据**。

\`\`\`sql
-- 只取需要的列，避免 SELECT *
SELECT id, title_zh, published_at
FROM post
WHERE published = 1
ORDER BY published_at DESC
LIMIT 10;
\`\`\`

## 加索引的判断标准

1. 出现在 \`WHERE\`、\`JOIN\`、\`ORDER BY\` 中的高频列
2. 区分度足够高（例如状态列区分度低，不适合单独建索引）
3. 用 \`EXPLAIN\` 验证，而不是凭感觉

## 小结

先测量，再优化。没有度量数据的优化，通常只是自我安慰。
`,
    contentEn: `## Where slow queries come from

Most performance issues are not "slow SQL" but **missing indexes** or **fetching more than you need**.

\`\`\`sql
-- Select only what you need instead of SELECT *
SELECT id, title_en, published_at
FROM post
WHERE published = 1
ORDER BY published_at DESC
LIMIT 10;
\`\`\`

## When to add an index

1. Columns frequently used in \`WHERE\`, \`JOIN\` or \`ORDER BY\`
2. High selectivity (status flags are usually poor candidates)
3. Verify with \`EXPLAIN\` instead of guessing

## Summary

Measure first, optimize second. Optimization without metrics is usually self-comfort.
`,
  },
];

const projects = [
  {
    slug: 'personal-site',
    nameZh: '个人站点（本站）',
    nameEn: 'Personal Site (this one)',
    descZh: '带后台管理系统的个人博客与作品集，支持中英双语与深色模式。',
    descEn: 'A bilingual personal blog and portfolio with a built-in admin panel and dark mode.',
    tech: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Prisma', 'SQLite'],
    repoUrl: 'https://github.com/',
    demoUrl: '',
    status: 'active',
    featured: true,
    order: 1,
    contentZh: `### 功能

- Markdown 博客：标签筛选、搜索、分页、相关文章
- 作品集：技术栈筛选、外链跳转
- 后台管理：文章 / 项目 CRUD、留言收件箱、站点设置
- 中英双语切换、深色模式、响应式布局

### 部署

Next.js standalone 产物 + PM2 + nginx 反向代理，单进程即可承载整站。`,
    contentEn: `### Features

- Markdown blog: tag filter, search, pagination, related posts
- Portfolio: tech filter and external links
- Admin: post/project CRUD, message inbox, site settings
- Bilingual UI, dark mode, responsive layout

### Deployment

Next.js standalone output behind PM2 and nginx.`,
  },
  {
    slug: 'dev-toolkit-cli',
    nameZh: '开发者效率 CLI 工具集',
    nameEn: 'Developer Productivity CLI',
    descZh: '把日常重复操作封装成命令行工具：脚手架生成、数据库备份、日志分析。',
    descEn: 'A CLI that wraps daily repetitive work: scaffolding, database backup and log analysis.',
    tech: ['Node.js', 'TypeScript', 'Commander'],
    repoUrl: 'https://github.com/',
    demoUrl: '',
    status: 'active',
    featured: true,
    order: 2,
    contentZh: `### 起因

每次开新项目都要重复配置一遍：lint、commit 规范、CI、目录结构。于是写了一个脚手架命令。

\`\`\`bash
devkit init my-app --template next-ts
devkit backup --db ./prisma/prod.db
\`\`\``,
    contentEn: `### Motivation

Every new project required the same setup: lint, commit conventions, CI, folder layout. So I built a scaffolding command.

\`\`\`bash
devkit init my-app --template next-ts
devkit backup --db ./prisma/prod.db
\`\`\``,
  },
  {
    slug: 'data-dashboard',
    nameZh: '数据可视化看板',
    nameEn: 'Data Visualization Dashboard',
    descZh: '面向运营团队的实时数据看板，支持多维度筛选与自定义图表。',
    descEn: 'A real-time dashboard for operations teams with multi-dimensional filters and custom charts.',
    tech: ['React', 'ECharts', 'Node.js', 'PostgreSQL'],
    repoUrl: '',
    demoUrl: 'https://example.com',
    status: 'archived',
    featured: false,
    order: 3,
    contentZh: `### 亮点

- 图表组件化，配置驱动，业务方无需改代码即可调整维度
- 数据量较大时自动降采样，保证首屏渲染速度
- 支持导出 PNG / CSV`,
    contentEn: `### Highlights

- Config-driven chart components so the business team can change dimensions without code
- Automatic downsampling keeps first paint fast on large datasets
- Export to PNG / CSV`,
  },
  {
    slug: 'markdown-notes-app',
    nameZh: 'Markdown 笔记应用',
    nameEn: 'Markdown Notes App',
    descZh: '本地优先的 Markdown 笔记工具，支持全文搜索与双向链接。',
    descEn: 'A local-first Markdown note app with full-text search and bidirectional links.',
    tech: ['Tauri', 'Rust', 'React'],
    repoUrl: 'https://github.com/',
    demoUrl: '',
    status: 'wip',
    featured: false,
    order: 4,
    contentZh: `### 设计原则

1. 本地优先：数据保存在本地文件，可随时用 git 同步
2. 纯文本：不锁定格式，随时可以带走
3. 快：冷启动 300ms 以内`,
    contentEn: `### Principles

1. Local-first: data lives in local files, sync with git anytime
2. Plain text: no lock-in
3. Fast: cold start under 300ms`,
  },
];

const settings: Record<string, string> = {
  siteTitleZh: '我的个人空间',
  siteTitleEn: 'My Personal Space',
  taglineZh: '写代码，也写生活',
  taglineEn: 'Code, thoughts and life',
  authorZh: '你的名字',
  authorEn: 'Your Name',
  bioZh: `你好，我是一名全栈开发者，专注于 Web 应用与工程效率。

平时喜欢折腾各种工具，把重复的事情自动化掉。这个站点用来记录我在技术上的思考、做过的项目，以及一些生活片段。`,
  bioEn: `Hi, I'm a full-stack developer focused on web applications and developer productivity.

I enjoy tinkering with tools and automating repetitive work. This site is where I keep technical notes, project write-ups and occasional life updates.`,
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
  skills: JSON.stringify([
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'Python',
    'PostgreSQL',
    'Redis',
    'Docker',
    'Nginx',
    'AWS',
  ]),
  available: 'true',
  themeScheduleEnabled: 'true',
  themeLightStart: '07:00',
  themeLightEnd: '19:00',
};

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    create: { username, passwordHash, nickname: username },
    update: { passwordHash },
  });
  console.log(`✅ 管理员账号就绪：${username} / ${password}`);

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }
  console.log(`✅ 站点设置写入完成（${Object.keys(settings).length} 项）`);

  // 生产环境可设置 SEED_DEMO=false，只初始化账号与站点设置，不写入示例内容
  if (process.env.SEED_DEMO === 'false') {
    console.log('ℹ️  已跳过示例文章与示例项目（SEED_DEMO=false）');
    return;
  }

  for (const post of posts) {
    const { tags, ...rest } = post;
    await prisma.post.upsert({
      where: { slug: post.slug },
      create: {
        ...rest,
        tags: JSON.stringify(tags),
        published: true,
        publishedAt: new Date(),
      },
      update: {},
    });
  }
  console.log(`✅ 示例文章写入完成（${posts.length} 篇）`);

  for (const project of projects) {
    const { tech, ...rest } = project;
    await prisma.project.upsert({
      where: { slug: project.slug },
      create: { ...rest, tech: JSON.stringify(tech) },
      update: {},
    });
  }
  console.log(`✅ 示例项目写入完成（${projects.length} 个）`);
}

main()
  .catch((error) => {
    console.error('❌ 初始化数据失败：', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
