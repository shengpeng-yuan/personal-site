# 技术文档

本文档说明本站用到的技术、整体架构、数据模型、接口约定，以及二次开发时该改哪里。

---

## 1. 技术栈总览

以下版本取自实际安装结果（`package-lock.json`）。

| 分类 | 技术 | 版本 | 用途 |
| --- | --- | --- | --- |
| 框架 | Next.js | 15.5.25 | 页面渲染 + 后端 API（App Router） |
| UI 库 | React | 19.3.0 | 组件与交互 |
| 语言 | TypeScript | 5.9.3 | 类型安全 |
| 样式 | Tailwind CSS | 3.4.19 | 原子化 CSS、设计系统 |
| 样式 | PostCSS / Autoprefixer | 8.4.49 / 10.4.20 | 构建管线 |
| ORM | Prisma | 6.19.3 | 数据库访问与建表 |
| 数据库 | SQLite | `prisma/dev.db` | 单文件数据库，可换 MySQL/PG |
| 鉴权 | jose | 5.10.0 | 签发/校验 JWT（Edge 兼容） |
| 鉴权 | bcryptjs | 2.4.3 | 密码哈希 |
| Markdown | react-markdown | 9.1.0 | Markdown → React |
| Markdown | remark-gfm | 4.0.1 | 表格、任务列表、删除线等 GFM 语法 |
| Markdown | rehype-raw | 7.0.0 | 允许正文内联 HTML |
| Markdown | rehype-highlight | 7.0.2 | 代码块语法高亮 |
| UI 图标 | lucide-react | 0.469.0 | 全站图标 |
| 工具 | date-fns | 4.4.0 | 日期格式化与相对时间 |
| 工具 | clsx | 2.1.1 | 条件拼接 className |

> 运行时要求：**Node.js ≥ 20**（实测 20 / 22 / 24 均可）。

---

## 2. 整体架构

```
                     ┌────────────────────────────┐
   浏览器  ──────▶   │  nginx  (80 / 443, HTTPS)   │
                     └──────────────┬─────────────┘
                                    │
        ┌───────────────────────────┼────────────────────────────┐
        │                           │                            │
 /_next/static/*              /uploads/*                    其余全部请求
 由 nginx 直接读磁盘       由 nginx 直接读磁盘          proxy_pass → 127.0.0.1:3000
        │                           │                            │
        │                           │                  ┌─────────▼─────────┐
        │                           │                  │  Next.js 进程      │
        │                           │                  │  (PM2 守护)        │
        │                           │                  └─────────┬─────────┘
        │                           │                            │
        │                           │              ┌─────────────▼──────────────┐
        │                           │              │ 1. middleware.ts           │
        │                           │              │    语言前缀重定向/后台鉴权  │
        │                           │              ├────────────────────────────┤
        │                           │              │ 2. 路由匹配 (app/ 目录)     │
        │                           │              ├────────────┬───────────────┤
        │                           │              │ 服务端组件  │ API Route      │
        │                           │              │ (读数据)    │ (写数据)        │
        │                           │              └─────┬──────┴───────┬───────┘
        │                           │                    │              │
        │                           │              ┌─────▼──────────────▼───────┐
        │                           │              │  Prisma Client              │
        │                           │              │        ↓                    │
        │                           │              │  SQLite: prisma/prod.db     │
        │                           │              └─────────────────────────────┘
```

**关键设计：读写分离路径**

- **读**（前台展示）：服务端组件直接调用 Prisma 查询，不经过 HTTP，没有额外的网络往返。
- **写**（后台操作、留言、上传）：走 `/api/*` Route Handler，浏览器用 `fetch` 调用。

**渲染模式**：所有依赖数据库的页面都声明了 `export const dynamic = 'force-dynamic'`，即每次请求实时渲染。这样做的原因是避免 `next build` 时去读数据库（构建机器上没有生产库会导致构建失败），代价是放弃了静态缓存。个人站点访问量小，这个取舍是划算的；如果以后想启用缓存，见 [NOTES.md](./NOTES.md)。

---

## 3. 目录结构

```
ai-project/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 根布局：<html>/<body> + 主题防闪烁脚本
│   ├── not-found.tsx             # 全局 404
│   ├── globals.css               # 设计令牌、组件类、Markdown 排版、代码高亮主题
│   ├── robots.ts                 # /robots.txt
│   ├── sitemap.ts                # /sitemap.xml（含中英双语全部 URL）
│   ├── [locale]/                 # 前台（语言前缀路由）
│   │   ├── layout.tsx            # 前台外壳：Header + Footer
│   │   ├── page.tsx              # 首页
│   │   ├── not-found.tsx         # 前台 404
│   │   ├── about/page.tsx        # 关于我 + 留言表单
│   │   ├── blog/
│   │   │   ├── page.tsx          # 列表（?page=&tag=&q=）
│   │   │   └── [slug]/page.tsx   # 详情
│   │   └── projects/
│   │       ├── page.tsx          # 列表（?tech=）
│   │       └── [slug]/page.tsx   # 详情
│   ├── admin/                    # 后台
│   │   ├── login/page.tsx        # 登录页（不套后台外壳）
│   │   └── (panel)/              # 路由组：括号不计入 URL
│   │       ├── layout.tsx        # 校验登录 + 侧边栏外壳
│   │       ├── page.tsx          # /admin 概览
│   │       ├── posts/            # /admin/posts、/new、/[id]
│   │       ├── projects/         # /admin/projects、/new、/[id]
│   │       ├── messages/         # /admin/messages
│   │       └── settings/         # /admin/settings
│   └── api/                      # 后端接口（见第 5 节）
├── components/
│   ├── site/                     # Header、Footer
│   ├── admin/                    # 后台表单与表格
│   ├── Markdown.tsx              # Markdown 渲染器
│   ├── PostCard.tsx              # 文章卡片（含封面占位组件）
│   ├── ProjectCard.tsx           # 项目卡片
│   ├── Pagination.tsx            # 分页
│   ├── SearchBar.tsx             # 搜索框
│   ├── ContactForm.tsx           # 留言表单
│   ├── ThemeToggle.tsx           # 主题切换（跟随时间 / 亮色 / 暗色 三态）
│   ├── LangSwitcher.tsx          # 中英切换
│   ├── SetHtmlLang.tsx           # 同步 <html lang>
│   ├── SecretAdminEntry.tsx      # 前台的隐藏后台入口（键盘密语 + 连点）
│   └── ViewTracker.tsx           # 阅读量上报
├── lib/
│   ├── prisma.ts                 # PrismaClient 单例
│   ├── content.ts                # 内容查询（文章/项目/标签/统计）
│   ├── settings.ts               # 站点设置的读写与本地化
│   ├── theme.ts                  # 主题模式、时段判断、防闪烁脚本生成
│   ├── uploads.ts                # 上传目录、允许的扩展名、文件名安全校验
│   ├── validators.ts             # 请求体 → 数据库字段的转换与校验
│   ├── session.ts                # JWT 签发/校验（Edge 兼容，无 next 依赖）
│   ├── auth.ts                   # 基于 Cookie 的登录态读取
│   ├── i18n.ts                   # 语言定义 + 中英文字典
│   └── utils.ts                  # cn / 日期 / 阅读时长 / slug 等工具
├── prisma/
│   ├── schema.prisma             # 数据模型
│   ├── seed.ts                   # 初始化脚本
│   └── prod.db                   # 数据库文件（不提交到 Git）
├── public/
│   ├── favicon.svg
│   └── uploads/                  # 上传的图片（不提交到 Git，部署时需持久化）
├── middleware.ts                 # 语言重定向 + 后台鉴权
├── DEPLOY.md                     # 部署方案
└── docs/
    ├── TECHNICAL.md              # 本文档
    └── NOTES.md                  # 注意事项与改善建议
```

---

## 4. 数据模型

文件：[prisma/schema.prisma](../prisma/schema.prisma)

### 4.1 User（后台管理员）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | Int | 主键，自增 |
| username | String | 唯一，登录名 |
| passwordHash | String | bcrypt 哈希（cost=10），**从不存明文** |
| nickname | String? | 可选昵称 |
| createdAt / updatedAt | DateTime | 时间戳 |

### 4.2 Post（文章）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | Int | 主键 |
| slug | String | 唯一，URL 标识（`/blog/<slug>`） |
| titleZh / titleEn | String | 中/英标题，至少填一个 |
| excerptZh / excerptEn | String | 列表页摘要 |
| contentZh / contentEn | String | Markdown 正文 |
| cover | String? | 封面图地址 |
| tags | String | JSON 字符串数组，如 `["Next.js","SQL"]` |
| published | Boolean | 是否发布（false = 草稿，前台不可见） |
| featured | Boolean | 是否精选（首页展示） |
| views | Int | 阅读量 |
| publishedAt | DateTime? | 首次发布时间，用于排序与上/下一篇 |

索引：`@@index([published, publishedAt])`

### 4.3 Project（项目）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | Int | 主键 |
| slug | String | 唯一 |
| nameZh / nameEn | String | 中/英名称 |
| descZh / descEn | String | 卡片上的简介 |
| contentZh / contentEn | String | 详情页 Markdown |
| cover | String? | 封面图 |
| tech | String | JSON 字符串数组（技术栈） |
| repoUrl / demoUrl | String? | 源码 / 演示外链 |
| status | String | `active` / `wip` / `archived` |
| featured | Boolean | 是否精选 |
| order | Int | 排序权重，越小越靠前 |

索引：`@@index([order])`

### 4.4 Setting（站点设置，键值对）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| key | String | 主键，如 `siteTitleZh` |
| value | String | 值；数组存 JSON，布尔存 `"true"`/`"false"` |
| updatedAt | DateTime | 最后修改时间 |

字段清单与默认值定义在 [lib/settings.ts](../lib/settings.ts)：站名、简介、作者、个人介绍、头像、所在地、邮箱、GitHub/X/LinkedIn/微信、简历链接、页脚文案、ICP 备案号与链接、公安备案号与链接、技能数组、是否可接洽、主题时段（是否启用 + 亮色起止时间）。

> 用键值对而不是固定列，是为了以后加设置项时**不需要改数据库结构**：只要在 `defaultSettings` 里加一个默认值，前后端就自动支持（后台表单会按分组渲染）。

### 4.5 Message（留言）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | Int | 主键 |
| name / email | String | 访客姓名与邮箱 |
| content | String | 留言内容（≤ 2000 字） |
| read | Boolean | 已读状态，后台侧边栏未读数依赖它 |

索引：`@@index([read])`

### 4.6 为什么用 JSON 字符串存数组

SQLite 没有原生数组类型。这些数组只用于「展示 + 简单筛选」，不需要按元素建索引或做关联查询，因此存 JSON 字符串最省事。读取时统一用 [lib/utils.ts](../lib/utils.ts) 里的 `parseList()` 解析（带容错，脏数据不会导致页面崩溃）。

---

## 5. 后端 API

所有接口都在 `app/api/**/route.ts`，参数 `runtime = 'nodejs'`（因为要用 bcrypt 和 fs）。

### 5.1 接口一览

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | 公开（限流） | 登录，成功后写入 httpOnly Cookie |
| POST | `/api/auth/logout` | 公开 | 清除会话 Cookie |
| PATCH | `/api/auth/password` | 需登录 | 修改密码（校验当前密码，新密码 ≥ 8 位） |
| GET | `/api/posts` | 需登录 | 文章列表（不含正文，供后台表格用） |
| POST | `/api/posts` | 需登录 | 新建文章 |
| GET | `/api/posts/:id` | 需登录 | 单篇详情（含正文） |
| PATCH | `/api/posts/:id` | 需登录 | 更新文章 |
| DELETE | `/api/posts/:id` | 需登录 | 删除文章 |
| POST | `/api/posts/:id/view` | 公开 | 阅读量 +1 |
| GET | `/api/projects` | 需登录 | 项目列表 |
| POST | `/api/projects` | 需登录 | 新建项目 |
| GET | `/api/projects/:id` | 需登录 | 单个项目 |
| PATCH | `/api/projects/:id` | 需登录 | 更新项目 |
| DELETE | `/api/projects/:id` | 需登录 | 删除项目 |
| POST | `/api/messages` | 公开 | 提交留言（校验必填 + 邮箱格式 + 长度） |
| GET | `/api/messages` | 需登录 | 留言列表 |
| PATCH | `/api/messages/:id` | 需登录 | 标记已读 / 未读 |
| DELETE | `/api/messages/:id` | 需登录 | 删除留言 |
| GET | `/api/settings` | 需登录 | 读取站点设置 |
| PUT | `/api/settings` | 需登录 | 保存站点设置（只接受字符串/布尔/字符串数组） |
| POST | `/api/upload` | 需登录 | 上传图片，返回 `{ url }` |

### 5.2 统一约定

- 成功：`{ item }` / `{ items }` / `{ ok: true }` / `{ settings }`
- 失败：`{ error: "中文错误提示" }`，HTTP 状态码语义化：
  - `400` 参数错误（如标题为空、邮箱格式不对）
  - `401` 未登录或登录过期
  - `404` 资源不存在
  - `409` slug 唯一冲突
  - `429` 登录尝试过于频繁
- 前端所有表单都直接展示后端返回的 `error` 文案，因此**错误提示只需要在服务端写一次**。

### 5.3 请求体校验放在哪

字段转换与校验集中在 [lib/validators.ts](../lib/validators.ts) 的 `buildPostData()` / `buildProjectData()`：

- 标题/名称至少填一种语言；
- slug 为空时用标题自动生成（`slugify`）；
- 空字符串统一转成 `null`（避免存一堆空串）；
- tags/tech 数组序列化成 JSON 字符串；
- 草稿不会覆盖已有的 `publishedAt`。

> ⚠️ 注意：Route Handler 文件**只能导出 HTTP 方法**（以及 `runtime`、`dynamic` 等配置）。把辅助函数写在 `route.ts` 里会导致 `next build` 报「does not match the required types of a Next.js Route」。这就是 `buildPostData` 放在 `lib/` 而不是 `route.ts` 里的原因。

---

## 6. 鉴权与会话

### 6.1 流程

```
① 提交用户名密码
   POST /api/auth/login  { username, password }
        ↓
② 限流检查（同一 IP 10 分钟内 ≥ 10 次失败 → 429）
        ↓
③ 查 User，bcrypt.compare(password, passwordHash)
        ↓
④ jose 签发 HS256 JWT（含 userId、username，有效期 7 天）
        ↓
⑤ 写入 Cookie: site_session
   HttpOnly + SameSite=Lax + Path=/ + Secure(生产)
        ↓
⑥ 后续请求：middleware 校验 /admin/* 路由
   API 路由：各自调用 requireAuth()
```

### 6.2 三个文件的职责划分

| 文件 | 职责 | 为什么分开 |
| --- | --- | --- |
| [lib/session.ts](../lib/session.ts) | 只做 JWT 签发/校验，**不 import next/headers** | middleware 跑在 Edge Runtime，不能引入 Node 专属 API |
| [lib/auth.ts](../lib/auth.ts) | `getCurrentUser()` / `requireAuth()`，基于 Cookie 读登录态 | 仅在服务端组件与 Route Handler 中使用 |
| [middleware.ts](../middleware.ts) | ① 无语言前缀 → 重定向 ② `/admin/*` 未登录 → 跳登录页 ③ 静态资源放行 | 在路由之前拦截，避免未授权页面被渲染 |

### 6.3 安全措施清单

- 密码：bcrypt cost=10，只存哈希；
- 会话：JWT 放在 **HttpOnly** Cookie 里，前端 JS 无法读取，能防 XSS 窃取；
- `SameSite=Lax`：防跨站请求携带 Cookie；
- 生产环境 `Secure`：只在 HTTPS 下发送；
- 登录限流：防暴力破解（内存级，重启清零）；
- 所有写接口二次校验登录态（不依赖 middleware 单一防线）；
- `JWT_SECRET` 缺失时直接抛错，避免用默认密钥悄悄上线。

---

## 7. 国际化（中英双语）

### 7.1 两种做法并用

| 内容类型 | 方案 | 位置 |
| --- | --- | --- |
| 界面文案（按钮、导航等固定文字） | 字典对象 | [lib/i18n.ts](../lib/i18n.ts) |
| 内容（文章标题/正文、项目名称、个人介绍） | 数据库双字段 | `titleZh` / `titleEn` … |

### 7.2 路由级语言

- URL 形如 `/{locale}/...`，`locale ∈ {zh, en}`，便于 SEO 与分享；
- 访问 `/` 时，middleware 读取 `Accept-Language` 决定跳 `/zh` 还是 `/en`；
- 无语言前缀的其他路径（如 `/blog`）统一补上默认语言 `/zh/blog`；
- 详情页取值的回退顺序：当前语言 → 中文 → 英文。所以**只填中文也能正常显示**，不会出现空白页。

### 7.3 具体实现点

- 服务端：`params` 是 Promise，需 `await`（Next.js 15 起）；
- 非法 locale：调用 `notFound()`，交给最近的一层 `not-found.tsx`；
- `<html lang>`：由客户端组件 [SetHtmlLang.tsx](../components/SetHtmlLang.tsx) 在挂载后同步；
- 语言切换时保留当前页面与查询参数（见 [LangSwitcher.tsx](../components/LangSwitcher.tsx) 的 `buildHref`）。

---

## 8. 主题与设计系统

### 8.1 三层结构

**① 设计令牌（CSS 变量）** — [app/globals.css](../app/globals.css)

```css
:root  { --bg: 250 250 252; --surface: 255 255 255; --fg: 15 23 42; --border: 226 232 240; ... }
.dark  { --bg:   8  13  23; --surface:  17  24  39; --fg: 226 232 240; --border:  39  51  71; ... }
```

变量存的是 **RGB 分量**（`250 250 252` 而不是 `#fafafc`），这样才能配合 `rgb(var(--bg) / 0.72)` 做半透明。

**② Tailwind 配置** — [tailwind.config.ts](../tailwind.config.ts)

- `darkMode: 'class'`：深色模式靠 `<html class="dark">` 切换；
- 自定义色板 `brand`（靛蓝）与 `ink`（石板灰）；
- 自定义阴影 `soft` / `glow`，动画 `fade-up` / `float` / `aurora`。

**③ 组件类** — `globals.css` 的 `@layer components`

`.card` `.card-hover` `.btn` `.btn-primary` `.btn-ghost` `.input` `.badge` `.glass` `.gradient-text` `.markdown` …

### 8.2 主题：按访客时间自动切换

主题有三种状态，逻辑集中在 [lib/theme.ts](../lib/theme.ts)：

| 状态 | 含义 |
| --- | --- |
| `auto`（跟随时间） | 默认。按**访客本地时间**与后台设置的「亮色时段」推算；未启用时段规则时跟随系统深色偏好 |
| `light` / `dark` | 访客手动选择，持久化在 `localStorage.theme`，**优先于时段规则** |

解析优先级：`localStorage 手动选择` → `时段规则（或系统偏好）`。

两个实现要点：

1. **防闪烁**：`buildThemeScript()` 把时段配置序列化后，由 [app/layout.tsx](../app/layout.tsx) 内联到 `<head>` 同步执行，
   **在首次绘制之前**给 `<html>` 加上 `dark` 类。放到 React 里做会出现「先白后黑」的抖动。
   代价是根布局需要读取站点设置，因此根布局声明了 `dynamic = 'force-dynamic'`（所有路由实时渲染，不在构建期访问数据库）。
2. **循环顺序不能只靠「当前模式」推断**：因为「自动」显示出来的效果可能和某个显式选项完全相同
   （例如白天自动＝亮色），一旦脱离自动态就无法判断下一步该去哪。所以 `themeCycle(autoResolved)`
   返回的是**完整顺序**，在离开自动态的那一刻确定下来，保证每次点击都有可见变化、且三态都可达：
   - 白天：跟随时间 → 暗色 → 亮色 → 跟随时间
   - 夜间：跟随时间 → 亮色 → 暗色 → 跟随时间

> 时间用的是 `new Date()`，即**访客浏览器的时区**，所以不同时区的访客各按自己的作息看到对应主题，
> 与服务器时区无关（服务器时区只影响文章日期的显示，见 NOTES.md）。

### 8.3 前台的隐藏后台入口

[components/SecretAdminEntry.tsx](../components/SecretAdminEntry.tsx) 提供两个不可见的触发方式：

- `SecretAdminKeyboard`：监听 `keydown`，滚动比对密语（默认 `admin`），挂在 `[locale]/layout.tsx`，所有前台页面可用；
- `SecretAdminClick`：包裹元素（首页头像名片），统计点击次数与时间窗口，用 `display: contents` 包裹所以不产生额外盒子、不影响布局。

两处关键防护：**忽略输入框内的按键**（否则在搜索框里打 "admin" 会被误触发）、**忽略带修饰键的按键**（Ctrl+C 等）。

> ⚠️ 这是**便利入口，不是安全机制**。前端隐藏手段必然可被发现，真正的防护是登录密码与会话校验。
> 密语与连点次数是文件顶部的常量，改完需要重新构建。

### 8.4 Markdown 渲染管线

```
Markdown 字符串
   → remark-gfm      （表格、任务列表、自动链接）
   → rehype-raw      （允许内联 HTML）
   → rehype-highlight（代码高亮，输出 hljs-* 类名）
   → React 元素
```

代码高亮配色没有引入 `highlight.js` 的官方主题包，而是在 `globals.css` 里手写了约 30 行 `.hljs-*` 规则（GitHub Dark 风格）。好处是**少一个运行时依赖、体积更小**，想换配色直接改 `.hljs-*` 即可。

> `rehype-raw` 意味着正文里的 HTML 会被执行。由于正文只有管理员能写，这是可接受的；若以后开放多人投稿，**必须**加上 `rehype-sanitize`。

---

## 9. 环境变量

| 变量 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- |
| `DATABASE_URL` | 是 | `file:./dev.db` | SQLite 文件路径；生产建议绝对路径 |
| `JWT_SECRET` | 是 | 无 | 会话签名密钥，缺失会直接报错 |
| `ADMIN_USERNAME` | 否 | `admin` | **仅 `npm run db:seed` 读取**，见下方说明 |
| `ADMIN_PASSWORD` | 否 | `admin123456` | **仅 `npm run db:seed` 读取**，见下方说明 |
| `NEXT_PUBLIC_SITE_URL` | 否 | `http://localhost:3000` | sitemap / robots 里的域名 |
| `COOKIE_SECURE` | 否 | 生产为 true | 设为 `false` 可在纯 HTTP 下登录（仅用于调试） |
| `SEED_DEMO` | 否 | 未设置 | 设为 `false` 时 seed 不写入示例文章与项目 |
| `UPLOAD_DIR` | 否 | `<cwd>/data/uploads` | 上传图片的存放目录 |

> ### `ADMIN_USERNAME` / `ADMIN_PASSWORD` 的语义（重要，容易误解）
>
> 这两个变量**不是运行时登录凭据**，只在执行 `npm run db:seed` 的那一刻被读取一次，
> 经 bcrypt 哈希后写入 `User` 表（见 [prisma/seed.ts](../prisma/seed.ts) 的 `prisma.user.upsert`）。
> 登录时 [app/api/auth/login/route.ts](../app/api/auth/login/route.ts) 只做 `bcrypt.compare(明文, 数据库里的哈希)`，
> 全程不会再读 `.env`。
>
> 由此推出两条实用结论：
>
> 1. **改了 `.env` 里的密码但没重跑 `db:seed`，登录密码不会变**——这是「密码明明改对了却登录不上」的头号原因；
> 2. `db:seed` 内部是 `upsert`（`update: { passwordHash }`），所以**重跑它会顺带把密码重置成当前 `.env` 的值**，这也是忘记后台密码时的官方找回方式。
>
> 日常修改密码请走后台「站点设置 → 修改登录密码」（`PATCH /api/auth/password`），不必改 `.env`。

模板见 [.env.example](../.env.example)（真实 `.env` 已被 `.gitignore` 排除）。

---

## 10. npm 脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发服务器（热更新），默认 http://localhost:3000 |
| `npm run build` | `prisma generate` + 生产构建（含完整类型检查） |
| `npm run start` | 以生产模式启动（需先 build） |
| `npm run db:push` | 把 schema 同步到数据库（不改数据，只改表结构） |
| `npm run db:seed` | 初始化管理员、站点设置、示例内容（幂等，可重复执行） |
| `npm run db:studio` | 打开 Prisma Studio 可视化查看/编辑数据库 |
| `npm run postinstall` | 自动执行 `prisma generate`（装完依赖就能用） |

---

## 11. 二次开发指引

### 11.1 给文章加一个字段

1. `prisma/schema.prisma` 的 `Post` 里加字段（如 `subtitleZh String @default("")`）；
2. `npx prisma db push` 同步表结构；
3. 在 `lib/validators.ts` 的 `buildPostData()` 里接收并清洗该字段；
4. 后台表单 `components/admin/PostForm.tsx` 加输入框；
5. 需要展示就在页面组件里读取。

### 11.2 加一个前台页面

在 `app/[locale]/` 下新建目录 + `page.tsx`，例如 `app/[locale]/links/page.tsx` → 访问路径 `/zh/links`。

导航入口在 [components/site/Header.tsx](../components/site/Header.tsx) 的 `navItems`，加一项即可（中英文案在 `lib/i18n.ts` 的 `nav` 里）。

### 11.3 加一个后台模块

1. `app/admin/(panel)/<模块>/page.tsx`（列表）+ `new/page.tsx` + `[id]/page.tsx`（表单）；
2. 对应 `app/api/<模块>/route.ts` 与 `app/api/<模块>/[id]/route.ts`，记得开头写：

```ts
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;   // 这一行是安全底线，不能漏
  // ...
}
```

3. 侧边栏加菜单项：`components/admin/AdminShell.tsx` 的 `navItems`。

### 11.4 换数据库

改 `prisma/schema.prisma` 的 `provider` 与 `.env` 的 `DATABASE_URL`，然后 `npx prisma db push && npm run build`。业务代码无需改动（详见 DEPLOY.md 第 11.2 节）。

### 11.5 提交前自检

```bash
npm run build      # 类型检查 + 编译，必须零报错
```

目前项目**没有配置 ESLint**。如果要接入，执行 `npx next lint` 按提示初始化即可。
