# 部署指南（云服务器 + 已有 nginx）

本文档面向「服务器上已经装好 nginx」的场景，从零把本站部署到线上，并用 nginx 做反向代理 + HTTPS。

> 📘 **部署完成后，日常操作（重启、备份恢复、后台使用、故障排查）请看 [docs/MANUAL.md](./docs/MANUAL.md)**，本文档只负责「第一次怎么装上去」。

技术栈：Next.js 15（前端 + 后端 API 同一个进程） + Prisma + SQLite。
部署形态：**PM2 守护 `next start` 单进程，nginx 反向代理到 `127.0.0.1:3000`**。

---

## 0. 先了解你要部署的这个站点

| 项目 | 说明 |
| --- | --- |
| 前台首页 | `https://me.heartgo.top/` → 自动跳转到 `/zh`（按浏览器语言判断中/英） |
| 后台管理 | `https://me.heartgo.top/admin` |
| 默认管理员 | 用户名 `admin`，密码 `admin123456`（**上线后第一件事就是改掉它**，后台「站点设置 → 修改登录密码」） |
| 数据库 | SQLite 单文件，默认 `prisma/prod.db`（下文会改成绝对路径） |
| 图片上传 | 保存在项目根目录的 `data/uploads/`，部署更新时**不要删除该目录**（可用 `UPLOAD_DIR` 环境变量改到别处） |

> 域名解析：先在域名服务商把 `A 记录` 指到你的服务器公网 IP，再往下做。

---

## 1. 服务器环境准备

以 **Ubuntu / Debian** 为例（CentOS 把 `apt` 换成 `dnf`/`yum` 即可）。

### 1.1 安装 Node.js 20 LTS

```bash
# 用 NodeSource 源安装（推荐，版本可控）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v   # 应输出 v20.x 或更高
npm -v
```

> 本项目在 Node 20 / 22 / 24 上均可运行。**不要用 Node 16 及以下**。

### 1.2 安装 PM2（进程守护）与 git

```bash
sudo npm install -g pm2
sudo apt install -y git
```

### 1.3 创建站点目录

```bash
sudo mkdir -p /var/www/personal-site
sudo chown -R $USER:$USER /var/www/personal-site
```

---

## 2. 上传代码到服务器

### 方式 A：用 Git（推荐，方便后续更新）

在你本地把项目推到 GitHub / Gitee 私有仓库，然后在服务器上：

```bash
cd /var/www
git clone <你的仓库地址> personal-site
cd personal-site
```

### 方式 B：直接上传（没有 Git 仓库时）

在**本地项目根目录**执行下面的命令（把 `user@你的服务器IP` 换成实际值）：

```bash
rsync -av --exclude node_modules --exclude .next --exclude '*.db' --exclude '.env' \
  ./ user@你的服务器IP:/var/www/personal-site/
```

Windows 下如果没有 `rsync`，可以用 scp（同样排除依赖与构建产物）：

```powershell
# 在项目根目录打开 PowerShell
scp -r app components lib prisma public package.json package-lock.json tsconfig.json `
  next.config.mjs postcss.config.mjs tailwind.config.ts middleware.ts `
  user@你的服务器IP:/var/www/personal-site/
```

> 注意：`.env` 不要上传，第 3 步会在服务器上单独创建（里面是密钥和数据库路径）。

---

## 3. 配置环境变量

在服务器项目目录下创建 `.env`：

```bash
cd /var/www/personal-site
nano .env
```

内容如下（**按注释修改**）：

```ini
# 数据库：改成绝对路径，避免相对路径带来的歧义
DATABASE_URL="file:/var/www/personal-site/prisma/prod.db"

# 会话签名密钥：务必替换成随机字符串
# 生成命令：openssl rand -base64 48
JWT_SECRET="把这里替换成 openssl rand -base64 48 的输出"

# 管理员账号：⚠️ 这两个值只在执行 npm run db:seed 的那一刻被读取一次，
# 用来把密码写入数据库（bcrypt 哈希）。之后你改这里不会影响登录密码，
# 改密码请用后台的「站点设置 → 修改登录密码」，或者重跑一次 db:seed。
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="改成你自己的强密码"

# 站点地址：用于 sitemap.xml / robots.txt，填你的正式域名
NEXT_PUBLIC_SITE_URL="https://me.heartgo.top"

# 上传图片的存放目录（可选）。不填则默认使用 <项目目录>/data/uploads
# UPLOAD_DIR="/var/www/personal-site-data/uploads"

# 注意：你的站点已经有 HTTPS，所以不要设置 COOKIE_SECURE=false。
# 只有临时用 http 访问排查问题时才需要加这行，排查完请删除。
# COOKIE_SECURE=false
```

> `.env` 已经在 `.gitignore` 中，不会被提交到仓库，放心写敏感信息。

---

## 4. 安装依赖 → 初始化数据库 → 构建

```bash
cd /var/www/personal-site

# 4.1 安装依赖（npm ci 严格按照 package-lock.json 安装，更可靠）
npm ci

# 4.2 创建数据库表结构
npx prisma db push

# 4.3 初始化数据
#     首次部署（想带示例文章/项目，方便看效果）：
npm run db:seed
#     正式上线（只要账号与站点设置，不要示例内容）：
# SEED_DEMO=false npm run db:seed

# 4.4 构建生产版本
npm run build
```

> ### ℹ️ `SEED_DEMO=false` 到底做了什么
>
> 它只控制「**要不要插入**示例内容」，**不会删除已经存在的示例内容**。如果之前已经不加参数跑过一次 `db:seed`，那 3 篇示例文章和 4 个示例项目就已经落库了，之后再怎么加 `SEED_DEMO=false` 也不会消失。
>
> 清理办法（只删这 7 个已知 slug，不会误删你自己写的内容）：
>
> ```bash
> sqlite3 prisma/prod.db "DELETE FROM Post WHERE slug IN ('building-a-personal-site-with-nextjs','how-i-organize-my-dev-workflow','notes-on-writing-sql-by-hand');"
> sqlite3 prisma/prod.db "DELETE FROM Project WHERE slug IN ('personal-site','dev-toolkit-cli','data-dashboard','markdown-notes-app');"
> ```
>
> 或者直接在后台「文章」「项目」里逐个删除。
>
> 另外注意：**站点设置（22 项）无论有没有这个参数都会被写入**，因为站点缺了它们无法渲染。站名「我的个人空间」、作者「你的名字」这类默认值请去后台「站点设置」里改成自己的，那不属于示例内容。
>
> 最后：`db:seed` 跑过一次就够了。之后改密码走后台「站点设置 → 修改登录密码」，改站名走后台「站点设置」，都不需要再跑它。

> ### ⚠️ 关于管理员密码（这里最容易困惑，务必看完）
>
> `.env` 里的 `ADMIN_USERNAME` / `ADMIN_PASSWORD` **不是登录凭据**。它们只在 `db:seed` 执行的那一刻被读取一次，被 bcrypt 哈希后写进数据库的 `User` 表；登录时只比对数据库里的哈希值。
>
> 所以会出现下面这两种情况：
>
> | 你的操作 | 结果 |
> | --- | --- |
> | 先跑 `db:seed`，之后才改 `.env` 里的密码 | ❌ 登录还是旧密码 —— 改 `.env` 不会生效 |
> | 改完 `.env`，再跑一次 `db:seed` | ✅ 密码被更新为新值 |
>
> `db:seed` 是幂等的（内部用 `upsert`），重复执行不会产生重复数据，**顺便会把管理员密码重置成当前 `.env` 里的值**。
>
> 因此「改了密码却登录不上」的标准解法是：
>
> ```bash
> cd /var/www/personal-site
> grep ADMIN_ .env                  # 1. 确认 .env 里到底写的是什么（注意别拼错）
> SEED_DEMO=false npm run db:seed   # 2. 让它把密码写进数据库
> ```
>
> 然后用 `.env` 里 `ADMIN_PASSWORD` 的**原文**登录 —— 注意不是本文档里的默认值 `admin123456`。
>
> 如果重跑 seed 后仍然登录失败，按顺序排查：
>
> 1. 确认编辑的是**服务器上**的 `/var/www/personal-site/.env`，不是本地那份；
> 2. `grep ADMIN_ .env` 看是否写了**两遍**（重复的键以先出现的为准，容易踩坑）；
> 3. 用 `sqlite3` 直接看数据库里到底有哪个账号：
>    ```bash
>    sudo apt install -y sqlite3        # 没有的话先装
>    sqlite3 prisma/prod.db "SELECT id, username FROM User;"
>    ```
>    查不到任何行 → 说明 seed 没跑成功，回到 4.3 重跑并观察报错。

构建成功的标志是最后输出一张路由表，并包含 `✓ Generating static pages (20/20)`。

> ⚠️ 每一步都要确认没有报错再继续。`npm run build` 会做完整的 TypeScript 类型检查。

---

## 5. 用 PM2 启动并设置开机自启

```bash
cd /var/www/personal-site

# 启动（-- start 后面的 -- 用于把参数传给 npm 脚本）
pm2 start npm --name personal-site -- start

# 查看运行状态与日志
pm2 status
pm2 logs personal-site --lines 50

# 保存当前进程列表，并配置开机自启
pm2 save
pm2 startup
# ↑ 该命令会打印一行 sudo 命令，复制粘贴执行一次即可
```

此时在服务器上自测：

```bash
curl -I http://127.0.0.1:3000
# 期望看到 HTTP/1.1 307 Temporary Redirect（跳到 /zh），说明服务已起来
```

---

## 6. 配置 nginx 反向代理

### 6.1 配置文件位置

本站的配置文件就是：

```
/etc/nginx/conf.d/personal-site.conf
```

直接编辑它：

```bash
sudo nano /etc/nginx/conf.d/personal-site.conf
```

> 你另一个站点（`day.heartgo.top`）的配置在 `/etc/nginx/conf.d/` 下的其他文件里，两边互不影响。
> 项目目录 `/var/www/personal-site` 只是本文档的约定，你可以放到任何位置（比如和静态站放一起）。
> 唯一要求：下面 `alias` 里的路径要和实际项目路径一致。

### 6.2 配置文件内容

写法跟你现有的 `day.heartgo.top` 保持一致（`listen 443 ssl` + 显式证书路径）：

```nginx
server {
    listen 443 ssl;
    server_name me.heartgo.top;

    # 复用你现有站点的通配符证书（*.heartgo.top），无需重新签发
    ssl_certificate     /etc/letsencrypt/live/heartgo.top/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/heartgo.top/privkey.pem;

    # 允许上传图片（后台单张限 5MB，这里留点余量）
    client_max_body_size 10M;

    # 原配置里的 root / index / try_files $uri $uri/ /index.html 是给静态站点用的，
    # 这里不需要：页面由 Node 应用生成，静态资源交给下面的 location 处理。

    # 构建产物由 nginx 直接读磁盘返回，不走 Node，和你的静态站思路一致
    location /_next/static/ {
        alias /var/www/personal-site/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 其余请求全部交给 Node 应用：
    # / 、/zh 、/en 、/blog 、/admin 、/api 、/uploads/... 都走这里
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

> 不需要给 `/uploads/` 单独配 `alias`：上传的图片是运行时写入的，由应用自身读盘返回（原因见 `docs/NOTES.md` 第 2.6 节）。
>
> 可选：如果你的 nginx 版本 ≥ 1.25.1，可以在 `listen 443 ssl;` 下面加一行 `http2 on;` 开启 HTTP/2（旧版本写成 `listen 443 ssl http2;`）。本站静态资源较多，开 HTTP/2 能明显减少握手开销。你的现有配置没开，所以这里默认保持一致。

### 6.3 证书怎么处理（重要）

你的证书路径是 `live/heartgo.top/`，但服务的是 `day.heartgo.top` —— 说明这是**通配符证书**（`*.heartgo.top`）。这种情况下新站点**直接复用上面那两行证书配置即可，无需重新签发**。

先确认证书覆盖哪些域名：

```bash
sudo certbot certificates
# 或者直接看证书内容
sudo openssl x509 -in /etc/letsencrypt/live/heartgo.top/cert.pem -noout -text | grep -A1 "Subject Alternative Name"
```

- 输出里有 `DNS:*.heartgo.top` → **复用即可**，跳到 6.4；
- 只有 `DNS:day.heartgo.top` 这类具体域名 → 需要给新域名单独签发：

```bash
sudo certbot certonly --nginx -d me.heartgo.top
# 签发后证书路径变成 /etc/letsencrypt/live/me.heartgo.top/，记得同步改上面的 ssl_certificate
```

> 用 `certonly` 而不是 `certbot --nginx`：后者会去自动改写你的 server 块，而这里的 server 块已经手写好了，只需要证书。

### 6.4 让 80 端口自动跳转到 HTTPS（可选）

如果希望访问 `http://me.heartgo.top` 时也能自动跳到 HTTPS，再加一个 80 的 server 块：

```nginx
server {
    listen 80;
    server_name me.heartgo.top;
    return 301 https://$host$request_uri;
}
```

### 6.5 检查并重载

```bash
sudo nginx -t                          # 必须输出 syntax is ok / test is successful
sudo systemctl reload nginx
curl -I https://me.heartgo.top       # 期望 307（跳转到 /zh）
```

### 6.6 防火墙

```bash
# ufw（Ubuntu 常见）
sudo ufw allow 80,443/tcp

# 或 firewalld（CentOS 常见）
# sudo firewall-cmd --permanent --add-service=http --add-service=https && sudo firewall-cmd --reload
```

> 云服务商（阿里云/腾讯云/AWS 等）还有一层**安全组**，需要在控制台放行 80 与 443。
> 你已经跑着 HTTPS 站点，这一步大概率早就通了。

---

## 7. 确认 HTTPS 相关配置

你已经有 HTTPS，所以**不需要再跑 certbot**（除非 6.3 里发现证书不覆盖新域名）。只需确认三件事：

1. `.env` 里 `NEXT_PUBLIC_SITE_URL="https://me.heartgo.top"`（用于 sitemap.xml / robots.txt）；
2. `.env` 里**不要**出现 `COOKIE_SECURE=false`。生产环境默认只在 HTTPS 下发送会话 Cookie，这正是我们想要的；
3. 执行 `pm2 reload personal-site` 让 `.env` 生效。

> ⚠️ 只有当你临时用 http 访问站点排查问题时，才需要临时加 `COOKIE_SECURE=false`，
> 否则会因为 Cookie 带 `Secure` 标记而登录不上。排查完记得删掉并重启。

---

## 8. 数据备份（重要，建议立刻配置）

SQLite 就是一个文件，备份非常简单。用 cron 每天凌晨 3 点备份并保留 14 天：

```bash
crontab -e
```

加入一行（同时备份数据库与上传的图片）：

```cron
0 3 * * * cp /var/www/personal-site/prisma/prod.db /var/www/backup/prod-$(date +\%F).db && tar -czf /var/www/backup/uploads-$(date +\%F).tar.gz -C /var/www/personal-site data/uploads && find /var/www/backup \( -name 'prod-*.db' -o -name 'uploads-*.tar.gz' \) -mtime +14 -delete
```

并确保备份目录存在：

```bash
sudo mkdir -p /var/www/backup && sudo chown -R $USER:$USER /var/www/backup
```

> 需要备份的是两样东西：**数据库文件 `prisma/prod.db`** 和 **上传的图片 `data/uploads/`**。两者都不在 Git 仓库里，丢了就找不回来。

---

## 9. 日常更新流程（改了代码之后）

```bash
cd /var/www/personal-site
git pull                     # 或重新上传改动文件
npm ci                       # 依赖有变化时执行
npx prisma db push           # 数据表结构有变化时执行
npm run build
pm2 reload personal-site     # 平滑重启，几乎无停机
```

> 更新时不要动 `prisma/prod.db` 和 `data/`，否则会丢数据和图片。
> 建议每次上线前打个 tag，出问题可以快速回滚：`git tag v1.0.1 && git push --tags`，回滚用 `git checkout v1.0.0 && npm ci && npm run build && pm2 reload personal-site`。

---

## 10. 常见问题排查

| 现象 | 原因与解决 |
| --- | --- |
| 访问域名返回 **502 Bad Gateway** | Node 进程没起来。执行 `pm2 logs personal-site` 看报错；常见是 `.env` 缺失或 `npm run build` 没执行。 |
| 后台登录提示「用户名或密码错误」 | **最常见的原因不是密码错了，而是 `.env` 改了但数据库没同步。** `.env` 里的 `ADMIN_PASSWORD` 只在 `db:seed` 时写入数据库一次；先 seed 后改 `.env` 的话，登录用的还是旧密码。解法：`SEED_DEMO=false npm run db:seed` 重跑一次，然后用 `.env` 里的原文登录（详见第 4 节说明）。若重跑后仍失败，用 `sqlite3 prisma/prod.db "SELECT id, username FROM User;"` 确认账号是否真的存在。 |
| 登录后立刻又回到登录页 | Cookie 的 `Secure` 标记与访问协议不匹配。你已经用 HTTPS，正常情况下不会出现；若临时用 http 访问，需在 `.env` 加 `COOKIE_SECURE=false` 后 `pm2 reload personal-site`，排查完记得删掉。 |
| 上传图片后访问 404 | 确认进程有写权限：`ls -ld /var/www/personal-site/data`；再确认 `UPLOAD_DIR`（若配置了）指向的目录存在且可写。图片是应用运行时读取的，**不要**给 nginx 配 `/uploads/` 的 alias。 |
| 上传图片成功但前台不显示 | 浏览器控制台看 `/uploads/xxx` 的状态码。404 说明文件没落盘（看 `pm2 logs` 有无权限报错）；502 说明应用进程挂了。 |
| 后台登录提示「尝试次数过多」 | 登录接口有 10 分钟 10 次的限流保护。等待 10 分钟，或重启进程 `pm2 restart personal-site`。 |
| 想换端口（3000 被占用） | 修改启动命令：`pm2 delete personal-site` 然后 `PORT=4000 pm2 start npm --name personal-site -- start`，同时改 nginx 里的 `proxy_pass` 端口。 |
| 数据库连不上 / 表不存在 | 执行 `npx prisma db push`；确认 `.env` 里 `DATABASE_URL` 是绝对路径且目录可写。 |
| 改了 `.env` 但不生效 | `.env` 只在进程启动时读取，必须 `pm2 reload personal-site`。 |
| 想查看实时日志 | `pm2 logs personal-site --lines 100` |

---

## 11. 进阶（可选）

### 11.1 用 standalone 产物减小体积

默认部署会带上完整的 `node_modules`（约 300~500MB）。如果服务器磁盘紧张，可以改用 Next.js 的 standalone 输出：

1. 打开 `next.config.mjs`，取消 `output: 'standalone'` 的注释；
2. `npm run build`，把产物拷到独立目录：

```bash
cd /var/www/personal-site
cp -r .next/standalone /var/www/personal-site-standalone
cp -r .next/static /var/www/personal-site-standalone/.next/static
cp -r public /var/www/personal-site-standalone/public
cp .env /var/www/personal-site-standalone/.env

# 上传目录不在 public 下，需要单独指过去（或在 .env 里设置 UPLOAD_DIR 的绝对路径）
ln -s /var/www/personal-site/data /var/www/personal-site-standalone/data
```

> ⚠️ standalone 模式必须在自己的目录下能找到 `data/`，否则上传的图片会 404。
> 用上面这种软链接是最省事的做法。另外 **数据库路径也必须是绝对路径**，
> 因为 standalone 的工作目录变了。

3. 用 node 直接启动：

```bash
cd /var/www/personal-site-standalone
pm2 start server.js --name personal-site
```

### 11.2 换成 MySQL / PostgreSQL

如果以后数据量变大或想用托管数据库，只需两步：

1. 修改 `prisma/schema.prisma` 的 datasource：

```prisma
datasource db {
  provider = "mysql"          // 或 "postgresql"
  url      = env("DATABASE_URL")
}
```

2. 修改 `.env`：

```ini
DATABASE_URL="mysql://用户名:密码@127.0.0.1:3306/personal_site"
```

然后重新执行 `npx prisma db push && npm run build`，业务代码**无需任何改动**。

---

## 12. 部署检查清单

上线前对照打勾：

- [ ] `.env` 中 `JWT_SECRET` 已替换为随机字符串
- [ ] `.env` 中 `DATABASE_URL` 使用绝对路径
- [ ] `.env` 中 `NEXT_PUBLIC_SITE_URL` 填的是正式域名（`https://`）
- [ ] `.env` 中没有残留 `COOKIE_SECURE=false`
- [ ] 后台默认密码 `admin123456` 已修改
- [ ] 服务器时区已设置（见 `docs/NOTES.md` 第 2 节，否则文章时间会差 8 小时）
- [ ] `npm run build` 成功，`pm2 status` 显示 online
- [ ] `pm2 startup` + `pm2 save` 已执行，重启服务器后站点能自动恢复
- [ ] `nginx -t` 通过，`https://你的域名` 能正常访问（307 跳到 /zh）
- [ ] 证书已覆盖新域名（`sudo certbot certificates` 确认，`*.heartgo.top` 通配符可直接复用）
- [ ] 数据库 + `data/uploads/` 备份 cron 已配置
- [ ] 发一条测试留言，确认后台「留言」能看到
- [ ] 在后台「站点设置」上传一张头像，确认前台能正常显示（验证上传链路）
