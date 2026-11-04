# PHASE 2 实际测试报告

最终复验日期：2026-11-04（Asia/Shanghai）。全部下列服务测试使用独立本地 Supabase，**不代表用户托管云项目已部署或通过验收**。

## 最终结果

| 检查 | 实测结果 |
|---|---|
| ESLint | `pnpm lint` 通过 |
| TypeScript | `pnpm typecheck` 通过 |
| 单元测试 | `pnpm test`，7 文件、66 项通过 |
| 前端密钥检查 | 51 个浏览器 bundle 文件未包含实际服务端管理员密钥，未输出密钥值 |
| 原始档案 | `pnpm check:docs`，17 份原始 SHA256 与 17 份工作文档/导航链接通过 |
| 生产构建 | `pnpm build` 通过；43 模块及账户/Auth/API 路由构建成功 |
| PostgreSQL 事务集成 | 79 项断言通过，打印 PASS 后 ROLLBACK，退出码 0 |
| Supabase HTTP/Auth/Storage | 113 项命名断言通过，退出码 0 |
| 完整生产浏览器套件 | `pnpm test:e2e:local --reporter=list,json`，20 项通过，0 失败、0 跳过，约 2 分钟 |
| 本地测试清理 | 最终 Auth 用户 0；私人 Storage 对象 0；测试文件按 Storage API 清理；没有向托管项目创建测试用户 |
| 云端验证 | 未执行：当前 Cloud 项目域名白名单与运行时密钥尚未生效 |

本地组件：Docker 28.4.0、官方 Supabase CLI 3.0.0、PostgreSQL 17.11.0.011、GoTrue 2.197.0、PostgREST 16.5、Storage 1.88.0、Kong 2.8.1、Mailpit 1.31.3。六个容器运行，带健康检查的容器均 healthy。CLI 二进制已按官方 SHA256 校验。

## 浏览器 20 项的覆盖

原有 13 项 PHASE 1.1 回归测试全部保留并通过：43 模块及首页、全部实际导航目标、404 恢复、桌面深浅主题与手机布局、30 份图片解码、减少动态、素材失败回退、Manifest/安装说明、公共离线外壳、私人缓存排除及等待确认的 PWA 更新。原回归测试没有删除或降低断言。页面导航审计的浏览器控制台和 pageerror 均无错误。

新增 7 项真实集成场景：

1. UI 登录/资料写入实际数据库、JSON/CSV 本人导出、匿名拒绝、伪造所有者字段与 CSRF 拒绝、授权同意/撤回历史。
2. 私人 PNG 真上传、受控本人下载、跨用户访问/删除拒绝、伪造文件头与 5 MiB 上限、删除元数据与文件。
3. UI 二次确认和密码重验后删除 Auth、七张公共表及全部私人文件（含没有媒体记录的孤立文件），其他用户不受影响。
4. 恶意/畸形 callback、token_hash、非法 PKCE flow ID 的安全返回，可信 origin、no-store 与 no-referrer 真实响应头。
5. 真实注册邮件到 Mailpit、重发、PKCE 邮箱确认、错误密码、登录持久化、退出、真实恢复邮件、新密码登录及清理。
6. 一个独立真实 Auth 会话撤销全部会话；已离线保存的 A 队列保留，登录 B 不读取/提交 A 数据，重新登录 A 恢复同步。
7. 桌面与移动视口的两个独立浏览器会话同步资料/偏好；断网写入真实 IndexedDB、恢复网络、冲突两种明确选择；服务器已写入但响应丢失后使用原幂等键重试，版本只增加一次；退出清理与下一账号隔离。

## 数据库权限测试

SQL：`tests/database/account_foundation.sql`，42 次 check_true、37 次 check_throws。使用真实 PostgreSQL 角色/策略与事务，不把前端隐藏操作当作安全措施。

SDK：`pnpm test:integration`。脚本拒绝托管 URL，只使用 loopback 真实服务；测试匿名及 A/B 的 SELECT、INSERT、UPDATE、DELETE、直接修改资料拒绝、CAS 并发、幂等重放、文件大小/MIME、跨用户 Storage、过期/缺失/撤销会话、退出后旧 access JWT 及 refresh token、删除屏障与级联。

Storage 1.88 自带直接 SQL 删除元数据保护，返回 42501；SQL 测试验证此保护，没有将其关闭。本人文件真实删除通过 Storage HTTP API 验证。

最终本地部署的 85 条迁移语句与源文件逐条匹配，SHA256 `e3ee70b56d33b0ab3d4e73e95525a5d1c16fa94624901006a92387c9f405f436`。SQL 测试回滚，SDK/浏览器 fixture 清理后本地 Auth 用户为 0。

## 测试中发现并修复

- Next.js 绑定地址进入认证重定向：统一使用显式可信 APP_URL；开发环境仅允许明确配置的私有 LAN HTTP，生产远程 origin 要求 HTTPS。
- 全局 Referrer-Policy 覆盖回调头：Auth 路径单独使用 no-referrer。
- 授权复选框等待写入时回弹：增加禁用的待确认状态，失败回滚并提示。
- 自动撤销会话误清除离线操作：区分用户明确退出与自动失效，真实撤销/重新登录测试通过。
- PKCE flow 的选择、账户删除后的 Cookie 与本地存储清理已在真实流程验证。
- 新测试改为等待可见且可用的登录表单、按可访问角色选择下拉框，避免匹配隐藏的 SSR 流式内容；原功能断言保留。

## 结果文件与复现

已提交的无敏感信息证据位于 `delivery/phase2/`：数据库断言摘要、浏览器结果摘要、导航/控制台审计、基线保护与完整文件清单。

原始 Playwright JSON、截图、trace 位于 Git 忽略的 `.private-test-artifacts/`、`test-results/`；凭据只在 Git 忽略的 `.env.local`。不将含认证流程的 trace 作为公开交付文件。

先按 ENV_SETUP 启动隔离的本地 Supabase 并生成本地环境，然后运行：

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm check:docs
pnpm test:integration
pnpm build
pnpm test:e2e:local
```

SQL 事务测试使用本地容器内 psql 执行文件。生产/托管项目不得使用本地 reset，也不得运行这些会创建临时用户的本地测试脚本。

尚未验证：托管项目、互联网邮件投递、真实手机硬件/PWA 安装、生产容量与备份恢复。两个浏览器会话是实际网络和数据库同步测试，移动端为浏览器视口模拟，未冒充真机结果。
