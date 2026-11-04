# 托管验收：Cloud 配置操作说明

状态：ACCEPTANCE BLOCKED。2026-11-04，本次实际读取的运行配置为 enforced，但目标 Supabase 域名不在已生效名单中，应用变量和 Secret 均未注入。GET 项目 `/auth/v1/health` 经原代理失败：`Tunnel connection failed: 403 Forbidden`。请求未携带认证信息，没有到达 Supabase；不能由此判断项目自身是否正常。

## 你现在需要做的事

1. 打开当前 Codex Cloud 环境的“环境设置 / Environment settings”。网络访问允许 `lrehapbujedrwpxzhqrt.supabase.co`，保留现有其他域名和预设。
2. 在环境变量中填入下表的公开配置；在 Secret 设置中填服务端密钥。不要发送到聊天，也不要放进 Git。
3. 保存后执行环境的“发布 / Publish”。我已确认草稿保存成功且返回 `requires_publish: true`；草稿保存不等于当前实例已经应用，也不部署网站。
4. 等平台完成发布与重新连接。如仍在旧任务实例，重新启动/进入使用该发布版本的环境。之后我会读取 readiness、确认代理请求和真实鉴权，再继续只读审查。

| 准确名称 | 用途与存放位置 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 环境变量，值为 `https://lrehapbujedrwpxzhqrt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 环境变量，填这个项目的公开 anon key；代码也支持 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，二选一即可，不要混用不同项目 |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret，仅服务端；目标 HTTPS 域名限定上述项目。代码也支持 `SUPABASE_SECRET_KEY`，二选一即可 |
| `NEXT_PUBLIC_APP_URL` | 环境变量。本轮受控 Cloud 内部浏览器可用建议值 `http://127.0.0.1:3000`，它是已验证的内部测试 origin，不是公网预览。正式远程部署后改成真实 HTTPS origin，不带页面路径 |
| `NODE_USE_ENV_PROXY` | 环境变量，当前 Node 24 代理环境建议 `1`；保持原有代理、CA、NO_PROXY 与 TLS 验证 |

名称来自 `src/lib/supabase/config.ts`、`admin.ts`、`features/auth/origin.ts` 及现有 ENV_SETUP。设置两种 key 别名时注意优先级：publishable 优先于 anon，secret 优先于 service_role；建议只设置选定的一套。公开 key 可以进入浏览器，管理员 key 绝不能进入 NEXT_PUBLIC、前端代码或报告。

我已在配置草稿保留项目域名、公开 key 与服务端 Secret 要求，新增 APP_URL、Node 代理要求与后续启动说明。APP_URL 的回环建议仅用于“内部前端 → 托管后端”测试，不等于用户能打开的公网网站，不替代后续正式部署地址。没有改动仓库配置成员、安装脚本、实际密钥值或当前运行网络。当前 Secret 元数据 `has_saved_binding=false`，还没有可复用绑定。

## 网站与 Auth

Supabase 项目 URL 是 API 地址，不是 FITNESS OS 网站。正式网站缺失不阻止已授权的数据库只读审查；APP_URL 是浏览器流程所需，不应成为目录审查的额外门槛。后续可明确选择受控本地前端连接托管后端进行测试，但这不等于公网部署。用户已确认：正式网站尚未部署，也没有可验证的公网预览地址。Cloud onboarding 不提供可直接分享的 localhost 预览；本次没有生成公网链接。

先只读记录 Supabase Dashboard 的 Authentication / URL Configuration。尚未部署时不填写虚构 Site URL；待实际测试 origin 确定后审查并追加准确 `/auth/callback`。如项目与其他应用共用，未经影响审查不要覆盖已有 Site URL/Redirect。正式网站部署时再使用真实站点 origin。回调会带 `next`、`sb_flow_id`，需在项目当前的重定向规则中允许其合法参数，避免全域通配。开启邮箱确认，使用默认 ConfirmationURL/PKCE 邮件链接；不要改成 token_hash 直连 `/auth/confirm`，该路由故意不建立会话。

确认/恢复邮件应在发起流程的浏览器打开；之后另一个设备可用已确认的邮箱密码登录。用户已指定两个受其控制的专用测试邮箱，以 A/B 标识，完整地址仅保存在 Git 忽略的私有映射中。本轮用户要求先准备，不发送邮件；涉及真实邮箱的测试继续待执行，不使用正式账号或无关收件人。现有邮件发送限制、CAPTCHA、SMTP 配置均尚未读取，不能声称云端邮件可用；限制阻碍时记录阻塞，不购买服务或擅自关闭安全设置。

## 数据库只读检查的另一个前提

应用 key 不能替代数据库目录审查权限。网络与应用配置生效后，还需使用已授权的数据库/CLI 连接，或由你在目标项目 Dashboard SQL Editor 执行 `supabase/reviews/hosted_schema_readonly.sql` 并提供不含私人记录的结果。不要发送数据库密码、连接串凭据或 access token 到聊天。

该脚本仅查询结构、策略、函数定义摘要、迁移版本和计数。它采用只读事务，不修改对象。实际备份、差异审查及迁移计划完成后，再单独请你确认迁移；这次指令没有预先批准任何未知差异。

本次未要求新增任意名称的迁移环境变量；`SUPABASE_DB_URL`、`DATABASE_URL`、`SUPABASE_ACCESS_TOKEN` 都不是当前应用必需配置。将来若选 CLI/数据库访问方式，应按实际工具和安全传递能力另行配置，而不是把代理 Secret 占位值当明文数据库密码。

## 避免把本地误当托管

当前被 Git 忽略的 `.env.local` 是本地 Docker 测试配置，不能证明托管配置已完成。已有 `test:integration` 和 `test:e2e:local` 明确拒绝托管 URL；不会删除这些保护来强行执行云端测试。托管浏览器构建必须使用已生效的完整公开配置，服务端还需正确的同项目 Secret。未满足前不启动任何托管写入测试。

本轮不升级套餐、不购买 SMTP、不调用付费 AI，不进入 BRAND STUDIO 或 PHASE 3。
