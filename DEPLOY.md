# 部署指南（云服务器 + 已有 nginx）

本文档面向「服务器上已经装好 nginx」的场景，从零把本站部署到线上，并用 nginx 做反向代理 + HTTPS。

技术栈：Next.js 15（前端 + 后端 API 同一个进程） + Prisma + SQLite。
部署形态：**PM2 守护 `next start` 单进程，nginx 反向代理到 `127.0.0.1:3000`**。

---

## 0. 先了解你要部署的这个站点

| 项目 | 说明 |
| --- | --- |
| 前台首页 | `https://你的域名/` → 自动跳转到 `/zh`（按浏览器语言判断中/英） |
| 后台管理 | `https://你的域名/admin` |
| 默认管理员 | 用户名 `admin`，密码 `admin123456`（**上线后第一件事就是改掉它**，后台「站点设置 → 修改登录密码」） |
| 数据库 | SQLite 单文件，默认 `prisma/prod.db`（下文会改成绝对路径） |
| 图片上传 | 保存在 `public/uploads/`，部署更新时**不要删除该目录** |

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

# 首次初始化管理员账号时使用（之后可以删掉这两行）
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="改成你自己的强密码"

# 站点地址：用于 sitemap.xml / robots.txt，填你的正式域名
NEXT_PUBLIC_SITE_URL="https://你的域名"

# 如果你暂时还没配 HTTPS，只是用 http 调试，请加上这行，否则无法登录后台
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

新建配置文件：

```bash
sudo nano /etc/nginx/conf.d/personal-site.conf
```

粘贴以下内容（**把 `你的域名` 换成实际域名**）：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 你的域名 www.你的域名;

    # 允许上传最大 10MB 的图片
    client_max_body_size 10M;

    # 让 Next.js 静态资源由 nginx 直接返回，速度更快
    location /_next/static/ {
        alias /var/www/personal-site/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 用户上传的图片
    location /uploads/ {
        alias /var/www/personal-site/public/uploads/;
        expires 30d;
        access_log off;
        try_files $uri =404;
    }

    # 其余请求交给 Next.js
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

检查并重载：

```bash
sudo nginx -t          # 必须输出 syntax is ok / test is successful
sudo systemctl reload nginx
```

然后开放防火墙的 80 / 443 端口：

```bash
# ufw（Ubuntu 常见）
sudo ufw allow 80,443/tcp

# 或 firewalld（CentOS 常见）
# sudo firewall-cmd --permanent --add-service=http --add-service=https && sudo firewall-cmd --reload
```

> 云服务商（阿里云/腾讯云/AWS 等）还有一层**安全组**，记得在控制台放行 80 与 443。

现在用浏览器访问 `http://你的域名` 应该能看到站点。

---

## 7. 配置 HTTPS（强烈建议）

没有 HTTPS 时，后台登录 Cookie 需要 `COOKIE_SECURE=false` 才能工作，而且很不安全。用 Let's Encrypt 免费证书：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名 -d www.你的域名
```

按提示选择「自动把 HTTP 重定向到 HTTPS」。certbot 会自动改好上面的 nginx 配置并配置自动续期。

配好 HTTPS 后：

1. 编辑 `.env`，确认 `NEXT_PUBLIC_SITE_URL="https://你的域名"`；
2. **删掉** `COOKIE_SECURE=false` 这一行（生产环境默认只在 HTTPS 下发送会话 Cookie）；
3. 重启服务：`pm2 reload personal-site`。

---

## 8. 数据备份（重要，建议立刻配置）

SQLite 就是一个文件，备份非常简单。用 cron 每天凌晨 3 点备份并保留 14 天：

```bash
crontab -e
```

加入一行：

```cron
0 3 * * * cp /var/www/personal-site/prisma/prod.db /var/www/backup/prod-$(date +\%F).db && find /var/www/backup -name 'prod-*.db' -mtime +14 -delete
```

并确保备份目录存在：

```bash
sudo mkdir -p /var/www/backup && sudo chown -R $USER:$USER /var/www/backup
```

> 上传的图片也要一起注意：`public/uploads/` 建议一并纳入备份范围。

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

> 更新时不要动 `prisma/prod.db` 和 `public/uploads/`，否则会丢数据和图片。

---

## 10. 常见问题排查

| 现象 | 原因与解决 |
| --- | --- |
| 访问域名返回 **502 Bad Gateway** | Node 进程没起来。执行 `pm2 logs personal-site` 看报错；常见是 `.env` 缺失或 `npm run build` 没执行。 |
| 登录后立刻又回到登录页 | HTTP 环境下 Cookie 被浏览器拒收。在 `.env` 加 `COOKIE_SECURE=false` 后 `pm2 reload personal-site`；配好 HTTPS 后应删掉此行。 |
| 上传图片后访问 404 | 检查 `public/uploads/` 是否存在且有写权限：`ls -ld /var/www/personal-site/public/uploads`；以及 nginx 里 `/uploads/` 的 `alias` 路径是否正确。 |
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
```

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
- [ ] `.env` 中 `NEXT_PUBLIC_SITE_URL` 填的是正式域名
- [ ] 后台默认密码 `admin123456` 已修改
- [ ] `npm run build` 成功，`pm2 status` 显示 online
- [ ] `nginx -t` 通过，域名能正常访问
- [ ] HTTPS 证书已签发，HTTP 自动跳转 HTTPS
- [ ] 数据库备份 cron 已配置
- [ ] 发一条测试留言，确认后台「留言」能看到
