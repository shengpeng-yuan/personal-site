# 操作手册（运维 + 使用）

> 这份文档回答两个问题：**日常怎么维护这个站点**、**后台功能怎么用**。
> 首次部署请看 [DEPLOY.md](../DEPLOY.md)；想了解架构原理看 [TECHNICAL.md](./TECHNICAL.md)；安全加固与优化建议看 [NOTES.md](./NOTES.md)。

## 目录

- [0. 速查卡（最常用命令）](#0-速查卡最常用命令)
- [1. 关键信息一览](#1-关键信息一览)
- [2. 改动生效规则（最重要的一张表）](#2-改动生效规则最重要的一张表)
- [3. 日常运维操作](#3-日常运维操作)
- [4. 内容与配置维护](#4-内容与配置维护)
- [5. 数据备份与恢复](#5-数据备份与恢复)
- [6. 用户使用手册](#6-用户使用手册)
- [7. 故障速查表](#7-故障速查表)
- [8. 相关文档索引](#8-相关文档索引)

---

## 0. 速查卡（最常用命令）

服务器上执行 npm 相关命令前，先进入项目目录：

```bash
cd /var/www/personal-site
```

| 我想做什么 | 命令 |
| --- | --- |
| 看站点是否活着 | `pm2 status` |
| 看实时日志 | `pm2 logs personal-site` |
| **重启服务（改完配置/代码后）** | `pm2 restart personal-site` |
| 停止服务 | `pm2 stop personal-site` |
| 重新构建（改了代码后） | `npm run build` |
| 改站点信息/密码 | 直接进后台 `https://me.heartgo.top/admin`，不用敲命令 |
| 备份数据库 + 图片 | 见 [5.1](#51-手动备份) |
| 解除登录限流 | `pm2 restart personal-site` |
| 改 nginx 后生效 | `sudo nginx -t && sudo systemctl reload nginx` |
| 看 nginx 报错 | `sudo tail -n 50 /var/log/nginx/error.log` |
| 完整发版流程 | [4.4 更新代码（发版）](#44-更新代码发版) |

---

## 1. 关键信息一览

把这些记下来，出问题时能快速定位（按你实际的服务器信息填写）：

| 项目 | 值 |
| --- | --- |
| 线上地址 | `https://me.heartgo.top` |
| 后台地址 | `https://me.heartgo.top/admin` |
| 项目目录 | `/var/www/personal-site` |
| nginx 配置 | `/etc/nginx/conf.d/personal-site.conf` |
| Node 应用端口 | `3000`（仅监听本机，由 nginx 反代） |
| PM2 进程名 | `personal-site` |
| 数据库文件 | `/var/www/personal-site/prisma/prod.db` |
| 上传图片目录 | `/var/www/personal-site/data/uploads/` |
| 环境变量文件 | `/var/www/personal-site/.env` |
| 备份目录 | `/var/www/backup/` |
| 证书文件 | `/etc/letsencrypt/live/heartgo.top/`（通配符 `*.heartgo.top`） |
| 管理员账号 | 后台可改，忘了就用 [4.1](#41-场景一修改正常密码推荐) 的方式重置 |

> ⚠️ **需要备份的只有两样东西**：`prisma/prod.db`（数据）和 `data/uploads/`（图片）。
> 其他文件都在 Git 仓库和服务器上，可以随时重新生成。

---

## 2. 改动生效规则（最重要的一张表）

「我改了东西怎么没生效」是最高频的问题。看这张表：

| 你改了什么 | 需要做什么才生效 |
| --- | --- |
| 后台里的文章 / 项目 / 留言 / 站点设置 | **什么都不用做**，刷新页面即可 |
| `.env` 文件（含 `JWT_SECRET`、`DATABASE_URL`、`NEXT_PUBLIC_SITE_URL` 等） | `pm2 restart personal-site` |
| `.env` 里的 `ADMIN_USERNAME` / `ADMIN_PASSWORD` | **改了不生效**，必须重跑 `SEED_DEMO=false npm run db:seed`（见 [4.2](#42-场景二忘记密码了)） |
| 源码（`.ts` / `.tsx` / `.css` / `tailwind.config.ts`） | `npm run build` → `pm2 restart personal-site` |
| `prisma/schema.prisma`（加了字段/表） | `npx prisma db push` → `npm run build` → `pm2 restart personal-site` |
| nginx 配置文件 | `sudo nginx -t` → `sudo systemctl reload nginx`（**不需要**重启 Node） |
| 服务器时区 | `sudo timedatectl set-timezone Asia/Shanghai` → `pm2 restart personal-site` |
| `public/` 下的静态文件（如 `favicon.svg`） | `npm run build` → `pm2 restart`，然后浏览器 Ctrl+F5 强刷 |

> 记住一条规律：**`.env` 和源码都只在「进程启动 / 构建」时被读取一次**，所以改完必须重启或重新构建；而后台里的内容存在数据库里，是实时读取的。

---

## 3. 日常运维操作

以下命令都在服务器上执行。

### 3.1 查看运行状态

```bash
pm2 status                      # 进程列表：状态、CPU、内存、重启次数
pm2 describe personal-site      # 详细信息：启动时间、重启次数、日志路径、工作目录
```

关注两点：

- `status` 是 `online`（不是 `errored` / `stopped`）；
- `restarts` 次数。如果这个数一直涨，说明进程在反复崩溃，去看日志。

### 3.2 启动 / 停止 / 重启

```bash
pm2 restart personal-site      # 重启（最常用）
pm2 stop personal-site         # 停止（网站会 502）
pm2 start personal-site        # 启动被 stop 的进程
pm2 reload personal-site       # 平滑重启（单实例下与 restart 基本等效）
pm2 delete personal-site       # 从 PM2 列表移除（要换启动参数时用）
```

**什么时候需要重启？**

- 改了 `.env`
- 改了源码并重新 `npm run build`
- 页面行为异常、想先「重启试试」
- **被登录限流锁住了想立刻解锁**（重启会清空名额）

**重启不会影响**：数据库内容、上传的图片、已登录用户（会话是 JWT，存在 Cookie 里，重启后仍然有效）。

### 3.3 查看日志

```bash
pm2 logs personal-site                    # 实时滚动，Ctrl+C 退出
pm2 logs personal-site --lines 100        # 只看最近 100 行
pm2 logs personal-site --err              # 只看错误日志
pm2 flush personal-site                   # 清空日志文件
```

日志文件的实际位置（`pm2 describe` 也能看到）：

```
~/.pm2/logs/personal-site-out.log
~/.pm2/logs/personal-site-error.log
```

> ⚠️ PM2 日志不会自动清理，长期运行会占满磁盘。装一次轮转插件即可：
> ```bash
> pm2 install pm2-logrotate
> pm2 set pm2-logrotate:max_size 10M
> pm2 set pm2-logrotate:retain 7
> ```

### 3.4 查看服务器资源

```bash
df -h                           # 磁盘剩余空间（日志/备份占满会导致服务异常）
free -h                         # 内存
ss -lntp | grep 3000            # 确认 3000 端口在监听
```

### 3.5 站点健康检查

三步确认站点是否正常：

```bash
# 1. Node 应用本身是否正常（期望 307，跳到 /zh）
curl -I http://127.0.0.1:3000

# 2. nginx 转发是否正常（期望 307）
curl -I https://me.heartgo.top

# 3. 页面是否真的能渲染（期望 HTML 里有「我的个人空间」之类的标题）
curl -s https://me.heartgo.top/zh | head -c 200
```

如果第 1 步不通 → 问题在 Node 应用，看 `pm2 logs personal-site`。
如果第 1 步通、第 2 步不通 → 问题在 nginx，看 `sudo tail -n 50 /var/log/nginx/error.log`。

### 3.6 获取/续期 HTTPS 证书

你的证书是通配符证书 `*.heartgo.top`，certbot 安装时已配置自动续期。手动检查：

```bash
sudo certbot certificates                    # 查看所有证书及到期时间
sudo certbot renew --dry-run                 # 演练续期（不实际签发）
sudo systemctl list-timers | grep certbot    # 确认自动续期定时器存在
```

续期后重载 nginx 才会用上新证书：

```bash
sudo systemctl reload nginx
```

---

## 4. 内容与配置维护

### 4.1 场景一：修改正常密码（推荐）

**直接进后台改，不用敲命令**：

```
https://me.heartgo.top/admin  →  站点设置  →  修改登录密码
```

需要填「当前密码」和「新密码（至少 8 位）」。改完立即生效，旧密码作废。

> 这是日常改密码的正确方式。后台改的是数据库里的密码哈希，与 `.env` 无关。

### 4.2 场景二：忘记密码了

用重跑 seed 的方式重置（`.env` 里的 `ADMIN_PASSWORD` 会被写入数据库）：

```bash
cd /var/www/personal-site
grep ADMIN_ .env                  # 先确认 .env 里写的用户名和密码
SEED_DEMO=false npm run db:seed   # 把密码写入数据库
```

`SEED_DEMO=false` 是必须的 —— 不加的话，如果数据库里没有示例内容，它会**补写** 3 篇示例文章和 4 个示例项目。

seed 是幂等的（内部用 `upsert`），重复执行不会产生重复数据，也不会覆盖你已有的文章和设置。

如果重跑后还是登录不上，按顺序排查：

```bash
# 1. 确认改的是服务器上的 .env
ls -l /var/www/personal-site/.env

# 2. 确认 .env 里没有重复的 ADMIN_PASSWORD 行（重复的键以先出现的为准）
grep -n ADMIN_ /var/www/personal-site/.env

# 3. 直接查数据库里到底有哪些账号
sqlite3 /var/www/personal-site/prisma/prod.db "SELECT id, username FROM User;"
```

第 3 步查不到任何行 → seed 没跑成功，回去看它的报错输出。

### 4.3 修改站点信息 / 换头像

全部在后台完成，**不需要敲命令、不需要重启**：

```
/admin/settings  基础信息      站名、简介、作者、所在地、页脚、ICP 备案号、接洽状态
/admin/settings  个人介绍      中文/英文简介（支持 Markdown）、头像上传
/admin/settings  技能/技术栈   首页和关于页展示的标签
/admin/settings  联系方式      邮箱、GitHub、X、LinkedIn、微信、简历链接
```

保存后前台刷新即可看到（页脚、首页、关于页会同步更新）。

### 4.4 更新代码（发版）

标准流程，四步：

```bash
cd /var/www/personal-site

git pull                     # 1. 拉取新代码
npm ci                       # 2. 安装依赖（依赖没变化时也可跳过，但执行更保险）

# 3. 如果这次更新改了 prisma/schema.prisma，执行下面这行；否则跳过
npx prisma db push

npm run build                # 4. 构建（必须看到 ✓ Compiled successfully）
pm2 restart personal-site    # 5. 重启生效
```

**建议先打 tag，方便回滚**：

```bash
git tag v1.0.1 && git push --tags
```

> ⚠️ 更新过程中**不要动** `prisma/prod.db` 和 `data/`，否则会丢数据和图片。
> `npm run build` 会占用较多内存，1GB 内存的机器建议先加 swap（见 [NOTES.md](./NOTES.md) 第 2.3 节）。

### 4.5 回滚到上一个版本

```bash
cd /var/www/personal-site
git log --oneline -10            # 找到要回滚到的版本号

git checkout v1.0.0              # 切到目标 tag（或填 commit hash）
npm ci
npx prisma db push               # 如果那次更新改过表结构
npm run build
pm2 restart personal-site
```

> 注意：代码回滚**不会**回滚数据。如果新版本已经写入过新字段的数据，回滚后可能显示异常，这种情况需要同时恢复数据库备份（见 [5.2](#52-恢复数据)）。

### 4.6 换域名 / 增加域名

1. 域名解析：在 DNS 服务商把新域名 A 记录指向服务器 IP；
2. 确认证书覆盖新域名：`sudo certbot certificates`。若是 `*.heartgo.top` 通配符则已覆盖；否则 `sudo certbot certonly --nginx -d 新域名`；
3. 改 nginx：编辑 `/etc/nginx/conf.d/personal-site.conf`，把 `server_name` 改成新域名（多个域名用空格分隔）。若证书路径变了，同步改 `ssl_certificate`；
4. 改 `.env`：`NEXT_PUBLIC_SITE_URL="https://新域名"`；
5. 依次生效：

```bash
cd /var/www/personal-site
pm2 restart personal-site                        # 让 .env 生效
sudo nginx -t && sudo systemctl reload nginx     # 让 nginx 生效
curl -I https://新域名                            # 验证
```

> 如果只是**追加**一个域名（老的继续用），在 `server_name` 后面加空格再写一个即可，`NEXT_PUBLIC_SITE_URL` 填主域名。

---

## 5. 数据备份与恢复

### 5.1 手动备份

一次性备份数据库和图片：

```bash
STAMP=$(date +%F)
mkdir -p /var/www/backup

# 数据库
cp /var/www/personal-site/prisma/prod.db /var/www/backup/prod-$STAMP.db

# 上传的图片
tar -czf /var/www/backup/uploads-$STAMP.tar.gz -C /var/www/personal-site data/uploads

ls -lh /var/www/backup/
```

自动备份（每天凌晨 3 点，保留 14 天）—— `crontab -e` 加入一行：

```cron
0 3 * * * cp /var/www/personal-site/prisma/prod.db /var/www/backup/prod-$(date +\%F).db && tar -czf /var/www/backup/uploads-$(date +\%F).tar.gz -C /var/www/personal-site data/uploads && find /var/www/backup \( -name 'prod-*.db' -o -name 'uploads-*.tar.gz' \) -mtime +14 -delete
```

> 注意 `find` 里那对 `\( ... \)` 不能省：`-o`（或）的优先级低于 `-mtime -delete` 的隐式「与」，
> 不括号包起来的话，`-mtime +14 -delete` 只会作用于后一个条件，**数据库备份永远不会被清理**，磁盘迟早被撑满。

检查定时任务是否生效：

```bash
crontab -l
sudo systemctl status cron        # 或 crond（CentOS）
```

### 5.2 恢复数据

> ⚠️ **必须先把服务停下来再恢复**，否则 SQLite 可能正在写入，会损坏文件。

```bash
# 1. 停服务
pm2 stop personal-site

# 2. 先留一份当前数据（万一恢复错了还能回来）
mv /var/www/personal-site/prisma/prod.db /var/www/personal-site/prisma/prod.db.bak

# 3. 恢复数据库
cp /var/www/backup/prod-2026-09-11.db /var/www/personal-site/prisma/prod.db

# 4. 恢复图片
rm -rf /var/www/personal-site/data/uploads
mkdir -p /var/www/personal-site/data
tar -xzf /var/www/backup/uploads-2026-09-11.tar.gz -C /var/www/personal-site

# 5. 启动并验证
pm2 start personal-site
pm2 logs personal-site --lines 30
curl -I http://127.0.0.1:3000
```

然后打开后台确认文章、留言都在，前台打开一篇文章确认图片能显示。

> 💡 **强烈建议实际演练一次恢复流程**。很多人配了备份却从没验证过能不能恢复，真出事时才发现备份是空的或解不开。

### 5.3 迁移到另一台服务器

```bash
# ---- 在旧服务器上打包 ----
cd /var/www/personal-site
tar -czf /tmp/site-full.tar.gz \
  --exclude=node_modules --exclude=.next \
  .

# 单独带上这两样（它们不在 Git 里，丢了就没了）
tar -czf /tmp/site-data.tar.gz prisma/prod.db data/uploads .env
```

```bash
# ---- 在新服务器上 ----
sudo mkdir -p /var/www/personal-site && sudo chown -R $USER:$USER /var/www/personal-site
cd /var/www/personal-site
# 上传 site-full.tar.gz 和 site-data.tar.gz 后解压
tar -xzf site-full.tar.gz && tar -xzf site-data.tar.gz

npm ci
npm run build
pm2 start npm --name personal-site -- start
pm2 save && pm2 startup           # 配置开机自启

# 然后按 DEPLOY.md 第 6 节配置 nginx（.env 里的 DATABASE_URL 要改成新服务器的绝对路径）
```

---

## 6. 用户使用手册

### 6.1 前台（访客看到的部分）

| 页面 | 地址 | 说明 |
| --- | --- | --- |
| 首页 | `/` | 自动跳转到 `/zh`；若浏览器语言是英文则跳 `/en`。展示头像名片、数据统计、精选文章、精选项目、技能栈 |
| 博客列表 | `/zh/blog` | 支持搜索框、标签筛选、分页（每页 6 篇） |
| 文章详情 | `/zh/blog/<slug>` | Markdown 正文、代码高亮、上一篇/下一篇、相关文章 |
| 项目列表 | `/zh/projects` | 支持按技术栈筛选 |
| 项目详情 | `/zh/projects/<slug>` | 技术栈、状态、源码 / 在线演示外链 |
| 关于我 | `/zh/about` | 个人介绍、技能、联系方式、**访客留言表单** |
| 英文版 | `/en/...` | 所有页面都有对应英文地址 |

页面上的两个开关：

- **左上角语言切换**「中文 / English」：切换语言并停留在当前页面；
- **右上角月亮/太阳图标**：切换深色 / 浅色模式，会记住你的选择。

### 6.2 后台登录

地址：`https://me.heartgo.top/admin`（未登录会自动跳到 `/admin/login`）

- 默认账号 `admin`，密码见你的 `.env`（初始化时写入的，忘了看 [4.2](#42-场景二忘记密码了)）；
- 登录状态保持 7 天，期间不用重复登录；
- **连续输错 10 次会锁定 10 分钟**，提示「尝试次数过多」。等 10 分钟，或 `pm2 restart personal-site` 立刻解锁。

登录后左侧是导航：

```
概览          数据统计、最近编辑的文章、最新留言
文章          文章列表与编辑器
项目          项目列表与编辑器
留言          访客留言（有未读时会显示红色角标）
站点设置      站点信息、个人介绍、技能、联系方式、修改密码
```

### 6.3 写一篇文章（详细步骤）

1. 后台 → 文章 → 右上角 **「写文章」**；
2. 填 **中文标题** 和 **英文标题**（至少填一个；只填中文也能正常显示，英文页面会自动回退到中文）；
3. **访问路径（slug）**：留空会自动根据标题生成。建议手动填英文，例如 `nextjs-personal-site`，分享出去更好看；
4. **内容**：默认在「中文内容」标签页，点「English」切到英文内容；
   - 支持 Markdown：`##` 标题、`-` 列表、`**粗体**`、`[链接](url)`、表格、```` ``` ```` 代码块（会自动高亮）；
   - 点右上角 **「预览」** 可以实时查看渲染效果，再点一次回到编辑；
5. **摘要**：填在列表页展示的简介。留空也可以，列表会自动截取正文开头；
6. **发布设置**（右侧）：
   - `立即发布`：**不勾选就是草稿，前台完全看不到**；
   - `设为精选`：勾选后会出现在首页的「最新文章」区域；
7. **封面图**（右侧）：可以点「上传图片」传本地图（png/jpg/webp，≤5MB），也可以直接粘一个外链地址。不传的话会显示一个渐变色占位块；
8. **标签**（右侧）：输入后按回车添加，可加多个。标签用于前台的筛选和「相关文章」推荐；
9. 点底部 **「创建文章」** 保存。

> 保存后可以在「文章」列表里看到它。想改就点文章标题或右侧的编辑图标；删除点垃圾桶图标（**不可恢复**，会二次确认）。

**为什么文章不显示在前台？** 按顺序检查：① 是否勾了「立即发布」；② 是不是在看英文页面但只填了中文（会回退，不会不显示）；③ 浏览器缓存，强刷一次。

### 6.4 管理项目

后台 → 项目 → **「新建项目」**。字段与文章类似，差别在这几个：

| 字段 | 说明 |
| --- | --- |
| 中文名称 / 英文名称 | 至少填一个 |
| 中文简介 / 英文简介 | 卡片上显示的一两句话 |
| 中文详情 / 英文详情 | 详情页的 Markdown 正文，适合写功能清单、技术方案 |
| **项目状态** | `维护中` / `开发中` / `已归档`，会以彩色标签显示在卡片上 |
| **排序权重** | 数字越小越靠前。首页只取前 3 个（优先精选） |
| **设为精选** | 首页「精选项目」区域优先展示 |
| **技术栈** | 回车添加，前台的筛选按钮就是从这里生成的 |
| 源码地址 / 在线演示 | 填了才会在卡片和详情页显示对应的跳转按钮 |

### 6.5 处理访客留言

访客在「关于我」页面提交的留言会出现在 **后台 → 留言**（有未读时侧栏显示红色角标）。

每条留言可以：

- **回复**：打开你本机的邮件客户端，收件人已自动填好（前提是访客填了邮箱）；如果想直接网页回信，需要另外接 SMTP，见 [NOTES.md](./NOTES.md) 第 3.8 节；
- **标为已读 / 标为未读**：管理未读状态；
- **删除**：不可恢复。

顶部可以按「全部 / 未读」筛选。

### 6.6 站点设置各字段的作用

| 分组 | 字段 | 会出现在哪里 |
| --- | --- | --- |
| 基础信息 | 站点名称（中/英） | 顶部导航栏 logo 旁、页脚、浏览器标签标题 |
| 基础信息 | 一句话简介 | 页脚、社交分享卡片 |
| 基础信息 | 作者名（中/英） | 首页大标题、页脚版权 |
| 基础信息 | 所在地 | 首页徽章、关于页名片 |
| 基础信息 | 页脚文案（中/英） | 页脚左侧介绍文字 |
| 基础信息 | ICP 备案号 | 页脚右下角 |
| 基础信息 | 可接受合作邀请 | 勾选后页脚显示绿色呼吸点、关于页显示状态 |
| 个人介绍 | 中文/英文介绍 | 关于页正文（支持 Markdown）；**首页只取第一段** |
| 个人介绍 | 头像 | 首页头像卡片、关于页名片 |
| 技能 / 技术栈 | 全部标签 | 首页技能区、关于页技能区 |
| 联系方式 | 邮箱等 | 关于页的联系方式卡片、页脚图标。**留空的项不会显示** |

> 改完点底部「保存设置」。当前站点设置会同时被中英文页面使用（中文页面读 `Zh` 字段，英文页面读 `En` 字段）。

### 6.7 内容显示规则（哪些内容会出现在哪里）

理解这几条规则，就不会再问「为什么它不显示」：

| 位置 | 显示规则 |
| --- | --- |
| 首页「最新文章」 | 已发布 **且** 勾了「精选」，最多 3 篇 |
| 首页「精选项目」 | 勾了「精选」的排前面，不足 3 个时用其他项目补齐，总共 3 个 |
| 博客列表 | 所有**已发布**文章，按发布时间倒序，每页 6 篇 |
| 「相关文章」区块 | 与当前文章**标签有重合**的文章，最多 3 篇。标签完全不重合时整个区块不显示 |
| 首页/关于页「技能栈」 | 站点设置里的技能标签，全部显示（首页头像卡片内只显示前 6 个） |
| 联系方式图标 | 站点设置里**填了值**的才显示 |

---

## 7. 故障速查表

| 现象 | 怎么定位 | 怎么解决 |
| --- | --- | --- |
| **502 Bad Gateway** | `pm2 status` 看进程是否 online | 没起来就 `pm2 logs personal-site` 看报错；常见是 `.env` 缺失、`npm run build` 没执行。修好后 `pm2 start personal-site` |
| **域名打不开、连不上** | `curl -I http://127.0.0.1:3000` | 本机通但域名不通 → nginx 问题：`sudo nginx -t`、`sudo tail -n 50 /var/log/nginx/error.log`、确认安全组放行 443 |
| **后台登录提示「用户名或密码错误」** | `sqlite3 prisma/prod.db "SELECT id, username FROM User;"` | 数据库里的密码才是真的。`.env` 改了要重跑 seed（见 [4.2](#42-场景二忘记密码了)） |
| **后台登录提示「尝试次数过多」** | 连续输错 10 次触发限流 | 等 10 分钟，或 `pm2 restart personal-site` 立刻解锁。**先确认密码再试** |
| **登录成功后又被踢回登录页** | 看浏览器地址栏是不是 http 而非 https | 用 https 访问。若临时用 http 调试，`.env` 加 `COOKIE_SECURE=false` 后重启，排查完删掉 |
| **上传图片成功但前台不显示** | 浏览器控制台看 `/uploads/xxx` 状态码 | 404 → 目录无写权限（`ls -ld /var/www/personal-site/data`）；确认 nginx **没有**给 `/uploads/` 配 alias |
| **文章时间差了 8 小时** | `timedatectl` 看时区 | `sudo timedatectl set-timezone Asia/Shanghai` 然后 `pm2 restart personal-site` |
| **文章不显示在前台** | 后台文章列表看状态标签 | 是「草稿」就编辑它并勾上「立即发布」 |
| **改了 `.env` 没反应** | — | `.env` 只在进程启动时读一次，必须 `pm2 restart personal-site` |
| **改了源码没反应** | — | 需要 `npm run build` 再 `pm2 restart` |
| **`npm run build` 被 Killed** | `free -h` 看内存 | 内存不足，加 2GB swap（见 [NOTES.md](./NOTES.md) 第 2.3 节） |
| **磁盘满了** | `df -h` | 清理备份：`ls -lh /var/www/backup/`；清理日志：`pm2 flush personal-site`；装日志轮转：`pm2 install pm2-logrotate` |
| **端口 3000 被占用** | `ss -lntp \| grep 3000` | 换端口：`pm2 delete personal-site` → `PORT=4000 pm2 start npm --name personal-site -- start`，并同步改 nginx 的 `proxy_pass` |
| **证书过期报警** | `sudo certbot certificates` | `sudo certbot renew` 然后 `sudo systemctl reload nginx` |
| **服务器重启后站点没了** | `pm2 status` 是空的 | 之前没配开机自启：`pm2 start npm --name personal-site -- start && pm2 save && pm2 startup`（按提示执行它打印的 sudo 命令） |
| **想彻底重来看日志** | — | `pm2 logs personal-site --lines 200`，日志里通常直接有报错原因 |

---

## 8. 相关文档索引

| 文档 | 什么时候看 |
| --- | --- |
| [DEPLOY.md](../DEPLOY.md) | **第一次部署**：服务器环境、上传代码、`.env`、nginx、HTTPS、备份 cron、检查清单 |
| [docs/TECHNICAL.md](./TECHNICAL.md) | 想改代码：技术栈、架构、数据模型、API 清单、鉴权与 i18n 机制、二次开发指引 |
| [docs/NOTES.md](./NOTES.md) | 想加固或优化：安全加固、运维踩坑、性能与体验改善建议、内容建议 |
| **docs/MANUAL.md（本文档）** | 日常：怎么重启、怎么备份恢复、后台怎么用、出问题怎么排查 |
