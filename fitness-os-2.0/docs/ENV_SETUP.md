# PHASE 2 环境设置

当前工作目录：`fitness-os-2.0/`（仓库子目录）。Node 24、pnpm 11。免费优先；没有购买服务、短信、OAuth 或 AI 调用。

## 已有云项目

用户提供的项目 API 地址：`https://lrehapbujedrwpxzhqrt.supabase.co`。这是应用调用的 API 根地址；项目管理使用 Supabase Dashboard。仅有 URL 不足以完成用户认证、迁移或删除账户。

Cloud 当前运行环境尚未放行此域名，GET `/auth/v1/health` 被网络代理以 403 拦截。这不是 Supabase 返回的登录失败，也不能据此判断项目是否暂停或正常。已保存环境配置草稿；用户需要在环境设置中填写密钥并发布环境配置，让当前环境重新应用配置。代码不会自动绕过白名单。

配置以下变量：

| 名称 | 用途 | 可进入前端 |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | 上述项目 URL | 是 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | 项目 anon key；也支持 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | 是，权限由 RLS 决定 |
| SUPABASE_SERVICE_ROLE_KEY | 服务端账户删除工作流；也支持 SUPABASE_SECRET_KEY | **否** |
| NEXT_PUBLIC_APP_URL | 浏览器实际访问的完整 origin，如本地 http://127.0.0.1:3000 | 是 |

公开 key 与服务端密钥从 Supabase Dashboard 的项目设置 / API Keys 获取。服务端密钥只填安全环境设置，不能发送聊天、提交 Git、放入 NEXT_PUBLIC 变量。公开 key 虽非管理员凭据，也无需在报告中记录具体值。

## 本地与 Windows

```powershell
cd fitness-os-2.0
corepack enable
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
# 在编辑器填入配置；不要把密钥粘贴到终端命令历史。
pnpm dev
```

电脑浏览器打开 `http://localhost:3000`。手机与电脑在同一可信 Wi-Fi 时，Windows 用 `ipconfig` 找 IPv4，手机打开 `http://<电脑IPv4>:3000`。把 NEXT_PUBLIC_APP_URL 改成实际访问 origin，并在 Supabase Auth URL Configuration 加入对应 callback；同一运行实例的写入只接受所配置 origin，避免同时混用 localhost、127.0.0.1 和局域网 IP。HTTP 局域网可以测试在线账户功能，PWA 安装和 Service Worker 需要 HTTPS 或本机 localhost 安全上下文。防火墙仅允许可信私有网络的 3000 端口。

## Auth URL 与邮件

Auth / URL Configuration 的 Site URL 设为正式站点 origin，Redirect URLs 精确列出 `<origin>/auth/callback` 和 `<origin>/auth/confirm`。保持邮箱确认开启。注册、密码恢复使用 PKCE；邮件链接需要在发起请求的浏览器打开。若自定义邮件模板使用 token_hash，可使用 `/auth/confirm?token_hash=…&type=email`（恢复使用 recovery）；不要把真实链接写入日志。

默认托管邮件服务有发送频率和收件人限制，不保证支持公开注册的生产流量。发布前需在 Dashboard 核对限制，按需配置自有 SMTP；本阶段未购买邮件服务。没有真实收件测试就不能声称生产邮件可用。

## 迁移云数据库

先审查 `supabase/migrations/20261103000100_account_foundation.sql`，备份已有项目，并检查同名表和 Storage 策略。迁移遇到已存在的应用表或 Storage 策略会主动中止，避免静默覆盖已有项目。不得跳过冲突检查直接删表。

官方 Supabase CLI 登录/授权后，可在本机运行 `supabase link --project-ref lrehapbujedrwpxzhqrt`，先检查 `supabase migration list` 和 `supabase db push --dry-run`，确认目标与 SQL 后再执行 `supabase db push`。数据库密码只在 CLI 的安全提示中输入。服务端 key **不能替代**迁移所需的 CLI/数据库授权。也可在 Dashboard SQL Editor 中审查并运行迁移，但必须记录迁移版本，避免 CLI 后续重复执行。

本次没有自动执行云端迁移；本地数据库通过不代表云端部署。

## 本地真实 Supabase

本地 Docker 测试使用独立的 `fitness-os-phase2-local`，不连接用户云项目。`scripts/local-supabase.sh` 使用官方 CLI 与官方镜像，凭据仅写入被 Git 忽略的 `.env.local`。本地 Mailpit 仅收取测试邮件，不发送到互联网。详情和实际执行结果见 TEST_REPORT。

## 免费成本与上线边界

本次新增服务费用为 0。建议 Supabase Free 起步，数据库、Storage、流量、活跃用户、邮件频率和暂停规则以当前项目 Dashboard 为准；未实时核对官方套餐数字，因此不把历史额度当成保证。单文件上限 5 MiB；不等于用户总存储限额。监控 Dashboard 用量，后续再增加用户总配额、自动过期导出、监控告警和可配置备份。免费套餐不应当作有生产 SLA 的健康数据备份服务。

Next.js 含服务端 API 与 SSR，需要 Node 托管环境，不能部署到仅支持静态文件的 GitHub Pages。托管平台免费额度和个人/商业使用条款需要上线前核对。没有生成或宣称公网预览链接。
