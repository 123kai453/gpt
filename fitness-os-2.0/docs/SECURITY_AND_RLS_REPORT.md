# PHASE 2 — 安全与 RLS 实施说明

本文件区分已经实现的控制与实际测试结果。代码存在不等于云端已经部署；真实环境测试的结论以 [TEST_REPORT.md](TEST_REPORT.md) 和 [PHASE2_IMPLEMENTATION_REPORT.md](PHASE2_IMPLEMENTATION_REPORT.md) 为准。当前实现没有接入 AI、设备、GPS、运动或营养的私人业务数据。

## 信任边界

浏览器只获得 Supabase 项目地址和 publishable/anon key。管理员凭据只在 `src/lib/supabase/admin.ts` 的 `server-only` 模块读取；账号 API 的普通资料、设置、授权、文件及导出均使用已登录用户的 Supabase 客户端和 RLS。管理员客户端仅用于最终 Auth 账号删除，目标用户 ID 来自服务端 `getUser()`，不能由请求参数指定。

每个账号 API 都验证 Auth 用户及数据库中的有效会话。未配置服务返回 503；没有有效登录返回 401；数据库迁移缺失、删除中、冲突或文件状态异常均有明确错误，不生成假账号或假成功。

## 私人数据与所有权

| 实体 | 普通用户读取 | 普通用户写入 | 归属规则 |
| --- | --- | --- | --- |
| profiles | 自己且会话有效 | 仅版本化 mutation RPC | id = auth.uid() |
| user_preferences | 自己且会话有效 | 仅版本化 mutation RPC | user_id = auth.uid() |
| user_consents | 自己的追加历史 | INSERT；撤回追加新记录，禁止编辑/删除历史 | user_id = auth.uid() |
| sync_metadata | 自己 | 自己的设备记录 | user_id + device_id |
| user_media | 自己 | 自己的受约束元数据 | user_id；对象路径首段必须为用户 UUID |
| user_data_exports | 自己 | 自己的导出任务 | user_id |
| account_deletion_jobs | 自己 | RPC 建立、本人更新任务状态 | user_id；每用户一个任务 |
| app_private.* | 无直接访问 | 仅固定 search_path 的内部函数 | 包含幂等回执、固定窗口限流计数 |
| storage.objects/private-media | 自己且会话有效 | 自己的命名空间；新增/替换需账号仍活跃 | bucket_id + 用户 UUID 路径首段 |

所有应用表启用 RLS；匿名角色不获得私人表权限。所有拥有者比较来自服务端验证后的 JWT，API 不接受任意 `user_id`。外键关联 `auth.users`，删除 Auth 用户会级联删除所有本阶段账号记录、内部回执及限流计数。

## 退出和过期会话

Supabase 原生退出通常先撤销 refresh token，已签发的 access JWT 可能持续到过期。此实现额外使用 `has_current_auth_session()` 校验 JWT 的 `session_id` 在 `auth.sessions` 中仍属于当前用户，并检查会话期限。私人表及 Storage 策略、版本化 mutation RPC、限流与删除 RPC 都要求该检查。API 同样调用这一检查，避免旧 JWT 在退出后继续读写。

应使用真实登录会话验证此行为，而非用前端隐藏按钮或伪造 `auth.uid()` 代替测试。过期签名由 Supabase 网关/认证验证；删除账号后的外键级联和会话检查阻止旧 JWT 创建孤立私人数据。

## 输入、冲突与幂等

账号修改采用严格 Zod 白名单；不接受额外所有者、版本、创建时间或 SQL 字段。SQL RPC 再次校验字段和值。用户名为 3–24 位英文字母、数字、下划线，大小写不敏感唯一；昵称不超过 64 字符；时区要求有效 IANA 名称；通知偏好只允许 email/push 布尔值。

`apply_account_mutation` 通过用户 UUID + mutation UUID 保存回执，同一个 UUID 与同一负载重放返回原结果；同一 UUID 不同负载拒绝。数据库行锁与 `baseVersion` 检查阻止静默覆盖并发修改；409 返回当前记录供用户选择。SQL 采用参数和 JSON 字段白名单，不拼接用户提供的 SQL。

## API、CSRF 与回调

所有账号 POST/DELETE 都检查 Origin，要求与 `NEXT_PUBLIC_APP_URL` 或请求本身的同源地址一致，同时拒绝 `Sec-Fetch-Site: cross-site`。JSON 请求有流式大小上限和 Content-Type 校验；上传流同样受上限控制。跨站或无 Origin 的写请求返回 403，命令行验证脚本需要显式发送正确 Origin。

认证回调仅允许预定义的站内返回路径；拒绝外部 URL、协议相对地址、反斜杠、编码绕过和未知路由。PKCE/邮箱 OTP 使用 Supabase 官方 SDK。浏览器输入由 React 文本渲染，不使用用户 HTML 注入；私人图片拒绝 SVG/HTML，下载带 `nosniff` 和受限 CSP。

## 限流

| 操作 | 固定窗口 | 实现位置 |
| --- | --- | --- |
| 资料/偏好 mutation | 120 次/分钟/用户 | 数据库 RPC 内部；幂等回放不重复消耗 |
| 媒体上传/删除 | 30 次/分钟/用户 | API 调用固定数据库限流 RPC |
| 授权记录追加 | 30 次/分钟/用户 | API 调用固定数据库限流 RPC |
| 数据导出 | 3 次/小时/用户 | API 调用固定数据库限流 RPC |
| 申请删除账号 | 3 次/小时/用户 | 数据库 RPC 首次申请；已有任务可继续 |

限制由数据库持久保存，不依赖单个 Next.js 进程。429 返回 Retry-After。邮箱和密码请求同时受 Supabase Auth 的平台限流与邮件配置约束；未增加短信、收费邮件或 Redis 服务。这里只对应用 API 设置操作速率，不能替代对 Supabase 公共端点的项目级反滥用设置；注册策略、邮件限制和免费配额仍需在正式上线前配置并监控。

## 私有 Storage 与上传

`private-media` 为私有桶，单文件最多 5 MB，仅允许 PNG/JPEG/WebP。服务器限制整个 multipart 请求长度，要求恰好一个 file 字段，检查声明 MIME 与文件签名、容器头/尾一致，丢弃用户文件名并生成 UUID 对象路径。签名检查不是恶意软件扫描或完整图像解码；本阶段不声称具备这两种能力。

上传先建立 pending 元数据，成功后更新 ready；失败保留可清理状态，最终登记失败时尝试删除已上传对象，不返回假成功。读取通过已验证账号的受控下载 API，不公开桶或永久图片 URL。删除先标记 deleting，再清理对象和元数据；数据库触发器原子清空被删除图片对应的头像引用并递增资料版本，避免并发产生悬空引用。失败保留记录供重试。

Storage 自身还限制命名空间、MIME、大小及活跃账号。公开品牌图片留在 public 目录。本阶段不接收 PDF、DOCX、视频或未来食品识别批量附件。

## 导出与账号删除

JSON/CSV 导出只读取当前用户本阶段的表与必要账号属性，不包含密码、token 或管理员凭据。查询以固定主键分页，防止 Supabase REST 单页上限造成截断。CSV 正确转义引号和换行，并防止公式单元格执行。导出包含私人图片元数据，图片本体通过私有图片下载另行获取；尚未同步的本地操作需使用队列备份导出。

账号删除要求输入 DELETE 与当前密码再次验证。管理员凭据缺失时在删除数据前返回 503。删除 RPC 将账号标记为删除中并禁止新增私人文件和资料写入，然后遍历用户 Storage 命名空间，包括没有媒体元数据的孤立对象。单次删除清理有批次预算，超出时返回可重试状态；必须再次确认没有剩余对象后才执行 Auth hard delete，由外键级联清理 SQL 数据。任何部分失败都有独立错误码与任务状态，不声称全部删除成功。Supabase 平台备份保留时间由项目套餐/平台政策决定，此实现不声称能自行清除平台所有历史备份。

## 缓存、日志及部署限制

账号 API 和私人图片响应统一 `Cache-Control: private, no-store`；不写入公共 Service Worker 缓存。IndexedDB 按账号隔离，退出、账号切换及删除后的本地清理由同步层处理。SW 仍只缓存公开静态资源，离线私人编辑通过已打开页面中的账号队列实现，不能因此承诺离线重载服务端私人页面。

API 对外只返回受控错误码和中文说明，不记录密码、token、原始 Supabase 错误、私人文件内容或完整请求体。管理员密钥位于环境变量，不得提交到 Git；测试账户和本地测试配置也不应提交。

## 验证状态与正式上线门槛

必须以真实 Supabase 实例执行 A/B/匿名用户的 SELECT、INSERT、UPDATE、DELETE、Storage、退出后和过期令牌测试，并完成账号流程、双会话同步、离线重放、导出和删除检查。测试脚本、运行环境和通过/失败统计记录在 TEST_REPORT.md。仅本地容器通过不等于托管云项目部署成功；只有完成目标云项目迁移、配置和同等回归，才能声明云端验收通过。
