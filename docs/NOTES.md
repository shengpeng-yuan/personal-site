# 注意事项与改善建议

这份文档是我在做完这个项目后，认为你**最需要知道、也最容易踩坑**的部分，以及后续可以怎么迭代。

分四部分：安全 → 运维 → 功能改善 → 内容建议。最后给出一个优先级排序。

---

## 一、上线前必须处理的（安全）

### 1. 三件套：改密码、换密钥、上 HTTPS

| 事项 | 为什么 | 怎么做 |
| --- | --- | --- |
| 改掉默认密码 | `admin123456` 写在公开代码库里，等于没有密码 | 后台 → 站点设置 → 修改登录密码 |
| 换 `JWT_SECRET` | 会话 Cookie 用这个密钥签名。用默认值的话，任何看过源码的人都能自己伪造一个管理员 Cookie，**直接绕过登录** | `openssl rand -base64 48`，写进 `.env`，然后 `pm2 reload` |
| 配 HTTPS | 没有 HTTPS 时登录 Cookie 只能在 `COOKIE_SECURE=false` 下传输，明文过网 | certbot 一行命令，见 DEPLOY.md 第 7 节 |

> 第 2 条是最容易被忽略、后果最严重的一条。代码里 `JWT_SECRET` 缺失时会直接抛错阻止启动，但如果你保留了那个默认的占位字符串，程序是能正常跑起来的 —— 所以务必手动换掉。

### 2. 后台入口裸露

`/admin` 是可以被扫描器直接猜到的。三种加固方式，任选其一：

- **最简单的**：nginx 里给 `/admin` 加 IP 白名单（只允许你的常用 IP 访问）。在你的 443 server 块里加一个 `location /admin`，其余照抄 DEPLOY.md 第 6.2 节的配置：

  ```nginx
  server {
      listen 443 ssl;
      server_name me.heartgo.top;

      ssl_certificate     /etc/letsencrypt/live/heartgo.top/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/heartgo.top/privkey.pem;

      client_max_body_size 10M;

      # 只允许指定 IP 访问后台
      location /admin {
          allow 1.2.3.4;          # ← 你的固定 IP，多个 IP 就写多行 allow
          deny all;

          proxy_pass http://127.0.0.1:3000;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }

      location /_next/static/ {
          alias /var/www/personal-site/.next/static/;
          expires 365d;
          add_header Cache-Control "public, immutable";
          access_log off;
      }

      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_cache_bypass $http_upgrade;
          proxy_read_timeout 60s;
      }
  }
  ```

  > - nginx 的前缀匹配是「最长优先」，所以 `location /admin` 和 `location /` 的书写顺序无所谓。
  > - **如果你的宽带是动态 IP，不要用这个方案**，否则换个网络就把自己锁在外面了 —— 改用下面两种。
  > - 白名单只挡页面，`/api/*` 不受影响；接口本身已有登录校验，不必额外配置。
- 给 `/admin` 再加一层 nginx Basic Auth（`htpasswd`），双保险；
- 改一下后台路径（需要改动 `middleware.ts` 和 `app/admin/` 目录名，稍麻烦）。

### 3. 留言接口可被刷

`POST /api/messages` 是公开接口，目前只做了「必填 + 邮箱格式 + 长度」校验，**没有频率限制和验证码**。会被脚本灌垃圾留言。

建议至少做其中一件：

- 抄 login 的内存限流（`app/api/auth/login/route.ts` 里的 `attempts` Map），限制同一 IP 每小时 N 条；
- 加一个蜜罐字段（隐藏输入框，被填了就丢弃）；
- 接 Cloudflare Turnstile（免费，前端加一个隐藏校验）。

### 4. 上传接口没有配额

`POST /api/upload` 需要登录才能调用，单文件限制 5MB，但**没有总量和频率限制**。如果账号泄露，磁盘可能被写满。

低成本的加固：在 nginx 层限制 `/api/upload` 的请求频率（`limit_req`），或定期清理 `data/uploads/` 里没被引用的孤儿文件。

### 5. `rehype-raw` 允许正文执行 HTML

Markdown 渲染用了 `rehype-raw`，所以正文里写的 HTML 会被真实执行。因为正文**只有你自己能写**，目前是可接受的（也方便你插入视频、iframe 播放器等）。

⚠️ 但如果以后开放多人投稿 / 用户评论，**必须**加上 `rehype-sanitize` 过滤，否则就是存储型 XSS。

### 6. 阅读量接口无服务端防刷

`POST /api/posts/:id/view` 任何人都能无限调用。前端用 `sessionStorage` 做了「同会话只上报一次」，但那只是客户端自觉，脚本刷一下就能把数字刷上天。

个人站点通常不在意这个。如果在意，需要按 IP + 时间段在服务端去重（加一张表或用 Redis）。

### 7. 其他几条

- **不要手动 `git add .env`**：`.gitignore` 已经排除了，但别绕过它；
- **不要把 `prisma/prod.db` 提交到仓库**：里面存的是 bcrypt 哈希和全部留言；
- **数据库文件必须放在 nginx 不可直接访问的路径**：目前它在 `prisma/` 下，而 nginx 的 `root` 指向的是别处，所以是安全的。不要去给 nginx 加一个能直接下载 `.db` 的 location。

---

## 二、部署与运维的坑

> ### ⚠️ 先说一个最常被误解的点：改了 `.env` 里的密码却登录不上
>
> `.env` 里的 `ADMIN_USERNAME` / `ADMIN_PASSWORD` **不是登录凭据**，它们只在 `db:seed` 执行的那一刻被读一次，然后哈希写进数据库。登录只比对数据库里的哈希。
>
> 所以「先 seed、后改 `.env`」是无效的，必须重跑一次 seed 才会把新密码写进去：
>
> ```bash
> cd /var/www/personal-site
> grep ADMIN_ .env                  # 确认拼写（注意 amdin / admin 这种笔误）
> SEED_DEMO=false npm run db:seed   # 把新密码写入数据库
> ```
>
> 之后用 `.env` 里的原文登录。这也是**忘记后台密码时的找回方式**。
> 平时改密码走后台「站点设置 → 修改登录密码」即可，不用动 `.env`。
>
> 另外 `db:seed` 是幂等的（`upsert`），重复跑不会产生重复数据。
> 但注意：不加 `SEED_DEMO=false` 的话，它会在缺少示例内容时**补写** 3 篇示例文章和 4 个示例项目。

### 1. ⚠️ 服务器时区（很容易忽略，但一定会遇到）

页面上的发布日期用的 `formatDate()`（[lib/utils.ts](../lib/utils.ts)）走的是**服务器本地时区**。如果服务器是默认的 UTC，而你在东八区晚上 10 点发文章，前台会显示成当天下午 2 点，**差 8 小时**。

检查与修复：

```bash
timedatectl                      # 看当前时区
sudo timedatectl set-timezone Asia/Shanghai
pm2 restart personal-site        # 重启生效
```

### 2. ⚠️ 不要用 PM2 的 cluster 模式

```bash
pm2 start npm --name personal-site -i max -- start   # ❌ 不要这样
pm2 start npm --name personal-site -- start          # ✅ 单实例
```

两个原因：

- **SQLite 是文件数据库**，多进程同时写容易 `SQLITE_BUSY`；
- 登录限流用的是**进程内存**里的 Map，多实例之间不共享（等于限流失效）。

如果将来确实需要多实例，先把数据库换成 PostgreSQL/MySQL，再把限流挪到 Redis。

### 3. 内存不足会导致构建失败

`next build` 是内存消耗大户，1GB 内存的小机器很容易被 OOM Killer 干掉，表现为构建到一半就 `Killed`。

```bash
# 加 2GB swap 兜底
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. `pm2 startup` 一定要执行

只执行 `pm2 start` 的话，服务器一重启站点就没了。完整流程：

```bash
pm2 start npm --name personal-site -- start
pm2 save            # 保存当前进程列表
pm2 startup         # 生成开机自启配置（会打印一行 sudo 命令，需要手动执行）
```

### 5. `.env` 改动不会自动生效

`.env` 只在进程启动时读取一次。改了之后必须 `pm2 reload personal-site`（或 `restart`），否则你会以为改的是别的东西。

### 6. ⚠️ 上传文件为什么不在 `public/` 里

这是一个**开发过程中实测发现并已修复的坑**，值得你知道原因，避免以后又改回去：

Next.js 官方明确说明——**只有构建时就存在于 `public/` 目录的文件才会被内置服务器提供**。运行时新增的文件在 `next start` 下会返回 404。

我实测确认过：

| 场景 | 结果 |
| --- | --- |
| 开发模式 `next dev`，运行时新增文件 | ✅ 200 |
| 生产模式 `next start`，构建时已存在的文件 | ✅ 200 |
| 生产模式 `next start`，**运行时新增**的文件 | ❌ **404** |

也就是说，如果按「上传到 `public/uploads/`」的常规做法，**本地开发一切正常，一上线所有图片全挂**。这是最难排查的一类问题。

所以现在的设计是：

```
上传 → 写入 data/uploads/<时间戳>-<随机串>.<ext>   （在 public 之外）
显示 → GET /uploads/<name> 由 app/uploads/[name]/route.ts 读盘返回
```

这样在 dev / `next start` / standalone 三种模式下行为完全一致，也不依赖 nginx 配置。

**因此：**
- 备份要带上 `data/uploads/`，不只是数据库；
- 更新部署时不要删 `data/`；
- 如果磁盘紧张想挪走，设置 `UPLOAD_DIR` 环境变量指向别处即可。

### 7. 日志会无限增长

PM2 默认把日志写在 `~/.pm2/logs/`，不管它的话会一直涨。装一个轮转插件：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 8. 部署后用浏览器强刷一次

nginx 对 `/_next/static/` 设了一年缓存，前端发版后文件名带 hash 所以没问题；但如果你改的是 `public/` 下的文件（比如 `favicon.svg`），记得在浏览器强刷（Ctrl+F5）才能看到更新。

---

## 三、功能与体验的改善建议

按「投入产出比」从高到低排列，前 5 条我个人觉得最值得做。

### 🥇 1. 加 RSS 订阅（成本最低，博客标配）

现在没有订阅入口。加一个 `app/rss.xml/route.ts`，把已发布文章拼成 XML 返回即可，大约 40 行代码，能让读者用 Feedly/Inoreader 订阅你。

### 🥈 2. 图片优化

现状：卡片封面用的是原生 `<img>`，没有压缩、没有响应式尺寸、没有 blur 占位。一张手机拍的照片可能 3MB，直接拖慢首屏。

三个选择，按简单程度排：

- 上传时用 `sharp` 压缩 + 生成缩略图（在 `app/api/upload/route.ts` 里加几行）；
- 改用 `next/image`（需要在服务器装 `sharp`，并把 `next.config.mjs` 的 `images` 配好）；
- 图片托管到对象存储（阿里云 OSS / 七牛 / Cloudflare R2），服务器只管文字，最省心也最稳。

### 🥉 3. 列表查询改成数据库分页

现在 `queryPosts()`（[lib/content.ts](../lib/content.ts)）的做法是**把全部已发布文章查出来，在 JS 里做标签过滤、关键词搜索、分页**。

在几十篇文章的量级完全没有问题，而且实现简单、逻辑直观。但文章到几百篇以后，每次列表页请求都会把全部记录读进内存，会变慢。

届时的改法：

- 分页改成 Prisma 的 `skip` / `take`；
- 关键词搜索用 SQLite 的 FTS5 全文索引（或换 PostgreSQL 的 `tsvector`）；
- 标签建议改成正经的关联表（`Tag` + `PostTag`），而不是 JSON 字符串。

### 4. 加缓存，替换 `force-dynamic`

现在所有页面都是每次请求实时查库。原因是避免 `next build` 时去连数据库。个人站点流量小，这样最稳妥。

想提速可以改成按需缓存：

```ts
// 页面里
export const revalidate = 300;   // 5 分钟缓存
```

然后在后台保存文章/项目的接口里调用 `revalidatePath('/zh/blog')` 精确失效。这样访客拿到的是缓存页面，你后台一保存又立刻更新。

### 5. 加内容缓存 + 骨架屏

列表页和详情页目前是「白屏 → 内容突然出现」。可以用 React 的 `<Suspense>` + `loading.tsx` 加骨架屏，观感会好很多。

### 6. 文章阅读体验

这几项都是小改动、大提升：

- **自动生成目录（TOC）**：正文里的 `h2/h3` 目前已经加了 `scroll-mt-24`（锚点定位不遮挡），但右侧还没有目录导航；
- **代码块一键复制**：技术博客的刚需；
- **回到顶部按钮**；
- **图片点击放大**（灯箱）。

### 7. SEO 细节补强

- `sitemap.ts` 里的中英页面目前是各自独立的 URL，建议补上 `alternates.languages` 的 hreflang 双向标注，避免被搜索引擎判为重复内容；
- 404 页面的 `<title>` 现在还是站点默认标题，可以给 `not-found.tsx` 单独导出 `metadata`；
- 可以给文章页补 JSON-LD 结构化数据（`Article` schema），搜索结果里能出富文本摘要。

### 8. 内容运营相关

- **草稿预览链接**：现在草稿只有登录后台才能看到，想发给朋友预览不方便。可以生成一个带临时 token 的预览 URL；
- **定时发布**：`publishedAt` 字段已经存在，只要把查询条件改成 `publishedAt <= now()` 就实现了「预约发布」；
- **留言邮件通知**：现在有新留言你得主动去后台看。接一个 nodemailer + SMTP，留言即发邮件；
- **评论系统**：如果想让读者互动又不想自己维护，直接嵌 Giscus（基于 GitHub Discussions，免费无后端）。

### 9. 工程化

- **加 ESLint + Prettier**：目前项目没有配置 lint。执行 `npx next lint` 会引导初始化。建议同时加 husky + lint-staged，在 commit 前自动检查；
- **加冒烟测试**：用 Playwright 写 5 个用例（首页 200、文章详情 200、后台能登录、留言能提交、上传能用），部署前跑一遍，能挡掉大部分低级事故；
- **加 CI**：GitHub Actions 里跑 `npm ci && npm run build`，防止推了编译不过的代码；
- **`.gitattributes`**：建议加一行 `* text=auto eol=lf`。你在 Windows 开发、Linux 部署，统一换行符可以避免每次提交都出现「整个文件都变了」的假 diff。

### 10. 深色模式跟随系统

现在只在页面首次加载时读一次系统偏好，之后用户切换系统主题页面不会跟着变。可以加一个 `matchMedia('(prefers-color-scheme: dark)')` 的监听。

---

## 四、内容层面的建议

技术只是壳子，这几点直接影响站点观感：

1. **换成真实头像和封面图**。现在头像和所有卡片封面都是渐变占位块，一眼就能看出是模板。一张真人头像 + 每篇文章一张配图，观感提升是断层式的。
2. **把示例信息全部替换掉**。站名、作者名、邮箱、「你的名字」、`https://github.com/` 这些占位内容还在设置里。
3. **slug 用英文或拼音**。分享链接时 `/blog/nextjs-personal-site` 比 `/blog/用-Next-js-打造` 好看也好记；中文 slug 在部分聊天软件里会被转义成一长串百分号编码。
4. **至少写 6~8 篇文章，并且标签要有交叉**。目前示例的 3 篇文章标签两两不重合，导致「相关文章」区块永远不显示（这个功能是好的，只是没数据触发）。标签交叉后它不仅会出现，还能让搜索引擎更好地理解你的内容聚类。
5. **写一篇「关于本站」**。既是自我介绍，也是展示技术能力的地方，顺便能解释这个站点是怎么搭的。

---

## 五、如果只做 5 件事

按优先级排序，做完这 5 件，站点就算真正上线可用且安全了：

1. **安全三件套**：改默认密码 → 换 `JWT_SECRET` → 配 HTTPS；
2. **备份 cron**：数据库 + `data/uploads/`，并且**实际演练一次恢复流程**（很多人配了备份却从没验证过能不能恢复）；
3. **服务器时区设为 `Asia/Shanghai`**：否则文章时间全是错的，而且你不会第一时间发现；
4. **内容替换**：换掉所有示例信息，传一张真实头像；
5. **加 RSS**：40 行代码，让站点从「一个网页」变成「可被订阅的内容源」。

再往后，按第三节的顺序迭代即可。
